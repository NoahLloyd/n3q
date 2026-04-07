import { createSupabaseBrowserClient } from "./client";
import {
  getOrCreateProfile as _getOrCreateProfile,
  updateProfile as _updateProfile,
} from "@n3q/shared";
import type { Profile } from "@n3q/shared";

const supabase = createSupabaseBrowserClient();

export async function getOrCreateProfile(walletAddress: string): Promise<Profile | null> {
  return _getOrCreateProfile(supabase, walletAddress);
}

export async function updateProfile(
  walletAddress: string,
  updates: {
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  }
): Promise<Profile | null> {
  return _updateProfile(supabase, walletAddress, updates);
}

// uploadAvatar stays web-only (uses File API and Supabase Storage)
export async function uploadAvatar(
  walletAddress: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${walletAddress}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  await updateProfile(walletAddress, { avatar_url: publicUrl });

  return publicUrl;
}
