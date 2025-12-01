import { createSupabaseBrowserClient } from "./client";
import type { Profile } from "./types";

const supabase = createSupabaseBrowserClient();

export async function getOrCreateProfile(
  walletAddress: string
): Promise<Profile | null> {
  // Try to get existing profile
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", walletAddress)
    .maybeSingle();

  if (existingProfile) {
    return existingProfile;
  }

  // Create new profile if it doesn't exist
  const { data: newProfile, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: walletAddress,
        display_name: null,
        avatar_url: null,
        bio: null,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return null;
  }

  return newProfile;
}

export async function updateProfile(
  walletAddress: string,
  updates: {
    display_name?: string | null;
    avatar_url?: string | null;
    bio?: string | null;
  }
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", walletAddress)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function uploadAvatar(
  walletAddress: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${walletAddress}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    throw new Error(uploadError.message);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update profile with new avatar URL
  await updateProfile(walletAddress, { avatar_url: publicUrl });

  return publicUrl;
}
