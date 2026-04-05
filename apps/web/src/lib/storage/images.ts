import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const LINK_IMAGES_BUCKET =
  process.env.LINK_IMAGES_BUCKET?.trim() || "link-images";

function guessExtension({
  contentType,
  fallbackUrl,
}: {
  contentType?: string | null;
  fallbackUrl?: string | null;
}) {
  if (contentType) {
    if (contentType.includes("png")) return "png";
    if (contentType.includes("webp")) return "webp";
    if (contentType.includes("gif")) return "gif";
    if (contentType.includes("svg")) return "svg";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      return "jpg";
    }
  }

  if (fallbackUrl) {
    const match = fallbackUrl.match(/\.(png|jpe?g|webp|gif|svg)/i);
    if (match) return match[1].toLowerCase().replace("jpeg", "jpg");
  }

  return "jpg";
}

function buildObjectPath(reference?: string) {
  const prefix = reference ? `items/${reference}` : "items";
  return `${prefix}/${randomUUID()}`;
}

export async function uploadImageBuffer({
  supabase,
  buffer,
  contentType,
  reference,
  extension,
}: {
  supabase: SupabaseClient;
  buffer: ArrayBuffer | Buffer;
  contentType?: string | null;
  reference?: string;
  extension?: string;
}) {
  const ext =
    extension ||
    guessExtension({ contentType: contentType ?? undefined }) ||
    "jpg";
  const objectPath = `${buildObjectPath(reference)}.${ext}`;

  const arrayBuffer =
    buffer instanceof Buffer ? buffer : Buffer.from(buffer as ArrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(LINK_IMAGES_BUCKET)
    .upload(objectPath, arrayBuffer, {
      contentType: contentType ?? `image/${ext}`,
      upsert: true,
    });

  if (uploadError) {
    console.error("Failed to upload image to storage", uploadError);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(LINK_IMAGES_BUCKET).getPublicUrl(objectPath);

  return publicUrl;
}

export async function persistRemoteImageToStorage({
  supabase,
  imageUrl,
  reference,
}: {
  supabase: SupabaseClient;
  imageUrl: string | null | undefined;
  reference?: string;
}) {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    const extension = guessExtension({ contentType, fallbackUrl: imageUrl });
    const buffer = await response.arrayBuffer();

    return uploadImageBuffer({
      supabase,
      buffer,
      contentType,
      reference,
      extension,
    });
  } catch (error) {
    console.error("Failed to persist remote image", error);
    return null;
  }
}


