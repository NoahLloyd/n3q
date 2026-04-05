import { createBrowserClient } from "@supabase/ssr";
import type { ContentInteraction, ContentItem, Profile } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase client is missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

export type DatabaseProfile = Profile;
export type DatabaseContentItem = ContentItem;
export type DatabaseContentInteraction = ContentInteraction;

export const createSupabaseBrowserClient = () =>
  createBrowserClient(
    supabaseUrl,
    supabaseAnonKey,
  );


