import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Error exchanging code for session", error.message);
    return NextResponse.redirect(new URL("/", request.url));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    // Profile exists - redirect based on verification status
    if (existingProfile.is_verified) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  // Create new profile for Google user
  const email = user.email;
  const displayName =
    user.user_metadata?.full_name || user.user_metadata?.name || null;
  const avatarUrl = user.user_metadata?.avatar_url || null;

  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email,
      display_name: displayName,
      avatar_url: avatarUrl,
      auth_method: "google",
      is_verified: false,
    },
    { onConflict: "id" }
  );

  // New Google user goes to pending verification
  return NextResponse.redirect(new URL("/pending", request.url));
}
