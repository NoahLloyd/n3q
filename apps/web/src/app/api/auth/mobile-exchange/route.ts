import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { signJwt } from "@/lib/jwt";

export async function POST(request: Request) {
  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { token } = body;
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Look up the token
  const { data: authToken, error: lookupError } = await serviceClient
    .from("mobile_auth_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (lookupError || !authToken) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Check if expired
  if (new Date(authToken.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 401 });
  }

  // Check if already used
  if (authToken.used_at) {
    return NextResponse.json({ error: "Token already used" }, { status: 401 });
  }

  // Mark token as used
  await serviceClient
    .from("mobile_auth_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", authToken.id);

  // Fetch the user's profile
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("*")
    .eq("id", authToken.user_id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Generate access token (1 hour)
  const accessToken = signJwt(
    {
      sub: profile.id,
      role: "authenticated",
      aud: "authenticated",
    },
    60 * 60 // 1 hour
  );

  // Generate refresh token (30 days)
  const refreshTokenRaw = randomUUID();
  const refreshTokenHash = createHash("sha256").update(refreshTokenRaw).digest("hex");

  await serviceClient.from("mobile_refresh_tokens").insert({
    user_id: profile.id,
    token_hash: refreshTokenHash,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: refreshTokenRaw,
    profile,
  });
}
