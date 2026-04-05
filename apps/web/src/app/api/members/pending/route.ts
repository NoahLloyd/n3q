import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  // Use service client if available (bypasses RLS), otherwise fall back to server client
  const serviceClient = createSupabaseServiceClient();
  const dbClient = serviceClient ?? (await createSupabaseServerClient());

  const { data, error } = await dbClient
    .from("profiles")
    .select("id, display_name, email, avatar_url, auth_method, created_at")
    .eq("is_verified", false)
    .eq("auth_method", "google")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[pending] Error fetching pending members:", error.message);
    return NextResponse.json(
      { error: error.message, hint: "Check that the profiles table has auth_method and is_verified columns" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}
