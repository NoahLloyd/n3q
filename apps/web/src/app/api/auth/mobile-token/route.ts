import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

export async function POST() {
  // Verify the user is authenticated
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // For wallet-only users, check the cookie/session for user ID
  // The auth context on the web side sets the user ID
  let userId = user?.id;

  if (!userId) {
    // Check for wallet-based auth via custom header
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
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
