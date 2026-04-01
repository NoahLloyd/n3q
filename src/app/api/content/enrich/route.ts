import { NextResponse } from "next/server";
import { buildEnrichedContent } from "@/lib/enrichment";
import { CONTENT_TYPE_OPTIONS } from "@/lib/content-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

    const { payload } = await buildEnrichedContent({
      url: trimmedUrl,
      type,
    });

    const { data, error } = await supabase
      .from("content_items")
      .insert({
        creator_id: creatorId,
        ...payload,
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
