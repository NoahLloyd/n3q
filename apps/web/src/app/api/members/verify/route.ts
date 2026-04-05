import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  // Parse the request
  let body: { userId?: string; verifierId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId: targetUserId, verifierId } = body;

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Get the requesting user's identity
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const actualVerifierId = user?.id || verifierId;

  if (!actualVerifierId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Use service client to bypass RLS (needed because the update policy
  // only allows users to update their own profile)
  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    console.error(
      "[verify] SUPABASE_SERVICE_ROLE_KEY is not configured. " +
      "Member verification requires the service role key to bypass RLS. " +
      "Set SUPABASE_SERVICE_ROLE_KEY in your .env file."
    );
    return NextResponse.json(
      {
        error:
          "Server configuration error: service role key not set. " +
          "Ask your admin to set SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 }
    );
  }

  // Verify the target user exists and is pending
  const { data: target, error: targetError } = await serviceClient
    .from("profiles")
    .select("id, is_verified, auth_method")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetError) {
    console.error("[verify] Error fetching target profile:", targetError.message);
    return NextResponse.json({ error: targetError.message }, { status: 500 });
  }

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (target.is_verified) {
    return NextResponse.json({ error: "User is already verified" }, { status: 400 });
  }

  // Perform the verification
  const { error: updateError } = await serviceClient
    .from("profiles")
    .update({
      is_verified: true,
      verified_by: actualVerifierId,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (updateError) {
    console.error("[verify] Error updating profile:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  console.log(`[verify] User ${targetUserId} verified by ${actualVerifierId}`);
  return NextResponse.json({ success: true });
}
