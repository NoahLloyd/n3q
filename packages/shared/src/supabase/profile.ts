import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../types";

export async function getOrCreateProfile(
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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
