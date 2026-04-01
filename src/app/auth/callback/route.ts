import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    console.error("[auth/callback] No code parameter");
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] Error exchanging code for session:", error.message);
    return NextResponse.redirect(new URL("/", request.url));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("[auth/callback] Error getting user:", userError?.message);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Use service client to bypass RLS for profile operations.
  // Falls back to server client if service key isn't configured.
  const dbClient = createSupabaseServiceClient() ?? supabase;

  // 1. Check if there's already a profile keyed by this Supabase user ID
  //    (returning Google user who already has a Google-created profile)
  const { data: profileById, error: selectError } = await dbClient
    .from("profiles")
    .select("id, is_verified")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError) {
    console.error("[auth/callback] Error checking profile by ID:", selectError.message);
  }

  if (profileById) {
    if (profileById.is_verified) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  // 2. Check if there's an existing profile with the same email
  //    (wallet user who already has a profile — link the accounts)
  if (user.email) {
    const { data: profileByEmail, error: emailError } = await dbClient
      .from("profiles")
      .select("id, is_verified, email")
      .eq("email", user.email)
      .maybeSingle();

    if (emailError) {
      console.error("[auth/callback] Error checking profile by email:", emailError.message);
    }

    if (profileByEmail) {
      // Link: store the Supabase user ID on the existing profile so the
      // auth context can find it later
      const { error: linkError } = await dbClient
        .from("profiles")
        .update({ google_user_id: user.id })
        .eq("id", profileByEmail.id);

      if (linkError) {
        console.error("[auth/callback] Error linking Google to existing profile:", linkError.message);
      } else {
        console.log(
          `[auth/callback] Linked Google user ${user.id} to existing profile ${profileByEmail.id}`
        );
      }

      // Existing member — go straight to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // 3. No existing profile — create a new one for this Google user
  const email = user.email;
  const displayName =
    user.user_metadata?.full_name || user.user_metadata?.name || null;
  const avatarUrl = user.user_metadata?.avatar_url || null;

  const { error: upsertError } = await dbClient.from("profiles").upsert(
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

  if (upsertError) {
    console.error("[auth/callback] Error creating profile:", upsertError.message);
  }

  return NextResponse.redirect(new URL("/pending", request.url));
}
