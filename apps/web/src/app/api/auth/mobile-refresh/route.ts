import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { signJwt } from "@/lib/jwt";

export async function POST(request: Request) {
  let body: { refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { refresh_token } = body;
  if (!refresh_token) {
    return NextResponse.json({ error: "refresh_token is required" }, { status: 400 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  // Hash the provided refresh token and look it up
  const tokenHash = createHash("sha256").update(refresh_token).digest("hex");

  const { data: storedToken, error } = await serviceClient
    .from("mobile_refresh_tokens")
    .select("*")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !storedToken) {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  // Check expiration
  if (new Date(storedToken.expires_at) < new Date()) {
    return NextResponse.json({ error: "Refresh token expired" }, { status: 401 });
  }

  // Check if revoked
  if (storedToken.revoked_at) {
    return NextResponse.json({ error: "Refresh token revoked" }, { status: 401 });
  }

  // Revoke the old refresh token (rotate)
  await serviceClient
    .from("mobile_refresh_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", storedToken.id);

  // Generate new access token
  const accessToken = signJwt(
    {
      sub: storedToken.user_id,
      role: "authenticated",
      aud: "authenticated",
    },
    60 * 60 // 1 hour
  );

  // Generate new refresh token
  const newRefreshTokenRaw = randomUUID();
  const newRefreshTokenHash = createHash("sha256").update(newRefreshTokenRaw).digest("hex");

  await serviceClient.from("mobile_refresh_tokens").insert({
    user_id: storedToken.user_id,
    token_hash: newRefreshTokenHash,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({
    access_token: accessToken,
    refresh_token: newRefreshTokenRaw,
  });
}
