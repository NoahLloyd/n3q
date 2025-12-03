import { NextResponse } from "next/server";
import { buildEnrichedContent } from "@/lib/enrichment";
import { CONTENT_TYPE_OPTIONS } from "@/lib/content-types";
import { generateNanoBananaImage } from "@/lib/nano-banana";
import {
  persistRemoteImageToStorage,
  uploadImageBuffer,
} from "@/lib/storage/images";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import type { ContentType } from "@/lib/supabase/types";

const isValidUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json().catch(() => null);

    if (!body || typeof body.url !== "string") {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const trimmedUrl = body.url.trim();

    if (!isValidUrl(trimmedUrl)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    let type: ContentType = "article";
    if (typeof body.type === "string") {
      if (!CONTENT_TYPE_OPTIONS.includes(body.type as ContentType)) {
        return NextResponse.json(
          { error: "Invalid content type" },
          { status: 400 }
        );
      }
      type = body.type as ContentType;
    } else if (body.type !== undefined) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const requestUserId =
      typeof body.userId === "string" && body.userId.trim().length > 0
        ? body.userId.trim()
        : null;

    const creatorId = user?.id ?? requestUserId;

    if (!creatorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user?.id && requestUserId && requestUserId !== user.id) {
      return NextResponse.json(
        { error: "User mismatch between session and payload" },
        { status: 403 }
      );
    }

    // Ensure the profile row exists so inserts don't fail on FK constraints.
    await supabase
      .from("profiles")
      .upsert({ id: creatorId }, { onConflict: "id" });

    const { payload, agent } = await buildEnrichedContent({
      url: trimmedUrl,
      type,
    });

    const originalImageUrl = payload.image_url;
    const baseAiNotes = { ...(payload.ai_notes ?? {}) } as Record<
      string,
      unknown
    >;
    const baseMetadata =
      baseAiNotes.metadata && typeof baseAiNotes.metadata === "object"
        ? (baseAiNotes.metadata as Record<string, unknown>)
        : {};
    const recordPayload = {
      ...payload,
      image_url: null,
      ai_notes: {
        ...baseAiNotes,
        metadata: {
          ...baseMetadata,
          originalImageUrl,
        },
      },
    };

    const { data, error } = await supabase
      .from("content_items")
      .insert({
        creator_id: creatorId,
        ...recordPayload,
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to persist enriched content", error);
      return NextResponse.json(
        { error: "Failed to save content" },
        { status: 500 }
      );
    }

    let imageStored = false;

    if (originalImageUrl) {
      const uploadedImageUrl = await persistRemoteImageToStorage({
        supabase,
        imageUrl: originalImageUrl,
        reference: data.id,
      });

      if (uploadedImageUrl) {
        const { error: updateError } = await supabase
          .from("content_items")
          .update({ image_url: uploadedImageUrl })
          .eq("id", data.id);

        if (!updateError) {
          data.image_url = uploadedImageUrl;
          imageStored = true;
        } else {
          console.error("Failed to update stored image URL", updateError);
        }
      }
    }

    if (!imageStored) {
      scheduleFallbackImageJob({
        itemId: data.id,
        basePrompt: agent.imagePrompt,
        title:
          recordPayload.ai_title ??
          recordPayload.title ??
          recordPayload.url ??
          "Untitled Link",
        summary: recordPayload.summary,
        siteName: recordPayload.site_name,
        url: recordPayload.url,
      });
    }

    console.info("[content.enrich] Stored enriched item", {
      itemId: data.id,
      url: payload.url,
      topics: payload.topics?.length ?? 0,
    });

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error("Unexpected error enriching content", error);
    return NextResponse.json(
      { error: "Failed to enrich content" },
      { status: 500 }
    );
  }
}

function scheduleFallbackImageJob({
  itemId,
  basePrompt,
  title,
  summary,
  siteName,
  url,
}: {
  itemId: string;
  basePrompt?: string | null;
  title: string;
  summary?: string | null;
  siteName?: string | null;
  url?: string | null;
}) {
  const prompt = buildHeroImagePrompt({
    basePrompt,
    title,
    summary,
    siteName,
    url,
  });

  if (!prompt) return;

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    console.warn(
      "[content.enrich] Skipping Gemini image generation (service role key missing)."
    );
    return;
  }

  setTimeout(() => {
    generateNanoBananaImage(prompt)
      .then(async (result) => {
        if (!result) return;
        const publicUrl = await uploadImageBuffer({
          supabase: serviceClient,
          buffer: result.buffer,
          contentType: result.contentType,
          reference: itemId,
        });

        if (!publicUrl) return;

        const { error } = await serviceClient
          .from("content_items")
          .update({ image_url: publicUrl })
          .eq("id", itemId);

        if (error) {
          console.error(
            "[content.enrich] Failed to persist generated image URL",
            error
          );
        }
      })
      .catch((error) =>
        console.error("[content.enrich] Gemini image job failed", error)
      );
  }, 0);
}

function buildHeroImagePrompt({
  basePrompt,
  title,
  summary,
  siteName,
  url,
}: {
  basePrompt?: string | null;
  title: string;
  summary?: string | null;
  siteName?: string | null;
  url?: string | null;
}) {
  const contextLines = [
    summary ? `Context: ${summary}` : null,
    siteName ? `Source: ${siteName}` : null,
    url ? `Link: ${url}` : null,
  ].filter(Boolean);

  const requirements = `Design an ultra-wide (approx 3:1) hero poster that spells the exact title "${title}" in gigantic centered typography, filling most of the canvas. Surround the lettering with symbolic, imaginative visuals that reflect the topic. Keep the palette polished, add depth/lighting, and avoid any extra text besides the title.`;

  return [basePrompt, requirements, ...contextLines]
    .filter(
      (section) => typeof section === "string" && section.trim().length > 0
    )
    .join("\n\n");
}
