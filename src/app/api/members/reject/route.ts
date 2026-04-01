import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { userId: targetUserId } = body;

  if (!targetUserId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Verify the caller is authenticated
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    return NextResponse.json(
      { error: "Server configuration error: service role key not set." },
      { status: 500 }
    );
  }

  // Delete the pending profile (and their Supabase auth user)
  const { error: deleteError } = await serviceClient
    .from("profiles")
    .delete()
    .eq("id", targetUserId)
    .eq("is_verified", false);

  if (deleteError) {
    console.error("[reject] Error deleting profile:", deleteError.message);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Also remove the Supabase auth user so they can sign up again if needed
  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(targetUserId);

  if (authDeleteError) {
    console.error("[reject] Error deleting auth user:", authDeleteError.message);
    // Profile is already deleted, so this is non-critical
  }

  console.log(`[reject] Rejected and removed user ${targetUserId}`);
  return NextResponse.json({ success: true });
}
