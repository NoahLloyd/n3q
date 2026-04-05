import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

export async function POST(request: Request) {
  // Try Supabase auth first (Google users)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userId = user?.id;

  // For wallet-only users, accept userId from request body
  if (!userId) {
    try {
      const body = await request.json();
      userId = body.userId;
    } catch {
      // No body provided
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Verify the user exists and is verified
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("id, is_verified")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!profile.is_verified) {
    return NextResponse.json({ error: "User not verified" }, { status: 403 });
  }

  // Generate a one-time token
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const { error } = await serviceClient.from("mobile_auth_tokens").insert({
    user_id: userId,
    token,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error("[mobile-token] Error creating token:", error.message);
    return NextResponse.json({ error: "Failed to create token" }, { status: 500 });
  }

  return NextResponse.json({
    token,
    deep_link: `n3q://auth?token=${token}`,
    expires_at: expiresAt.toISOString(),
  });
}
