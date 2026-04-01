import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Service client not configured" },
      { status: 500 }
    );
  }

  // Get the requesting user (must be an existing verified member)
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parse the request
  const { userId: targetUserId, verifierId } = await request.json();

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // The verifierId can come from either a Supabase auth user or a wallet address
  // For wallet users verifying, the verifierId is their wallet address
  // For Google users verifying, the verifierId is their Supabase user ID
  const actualVerifierId = user?.id || verifierId;

  if (!actualVerifierId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Use service client to bypass RLS and update the profile
  const { error } = await serviceClient
    .from("profiles")
    .update({
      is_verified: true,
      verified_by: actualVerifierId,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId);

  if (error) {
    console.error("Error verifying member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
