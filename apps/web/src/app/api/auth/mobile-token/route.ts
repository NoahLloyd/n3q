import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

export async function POST(request: Request) {
  // Clone the request so we can read the body even after Supabase auth check
  const body = await request.json().catch(() => ({}));

  // Try Supabase auth first (Google users)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Use Supabase auth user ID, or fall back to userId from request body (wallet users)
  const userId = user?.id || body.userId;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Use service client if available, otherwise use the server client
  const serviceClient = createSupabaseServiceClient();
  const dbClient = serviceClient ?? supabase;

  // Verify the user exists
  const { data: profile, error: profileError } = await dbClient
    .from("profiles")
    .select("id, is_verified")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[mobile-token] Error looking up profile:", profileError.message);
    return NextResponse.json({ error: "Failed to look up user" }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate a one-time token
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Try service client for insert (bypasses RLS), fall back to server client
  const { error } = await dbClient.from("mobile_auth_tokens").insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("[mobile-token] Error creating token:", error.message);
    return NextResponse.json(
      { error: "Failed to create token. The mobile_auth_tokens table may not exist yet — run the migration." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token,
    deep_link: `n3q://auth?token=${token}`,
    expires_at: expiresAt.toISOString(),
  });
}
