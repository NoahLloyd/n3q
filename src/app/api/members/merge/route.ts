import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Merges a Google-authenticated profile with an existing wallet profile.
 *
 * When a Google user connects a wallet that already has a profile, we:
 * 1. Copy Google-specific fields (email, google_user_id) onto the wallet profile
 * 2. Re-point any data created under the Google profile ID to the wallet profile ID
 * 3. Delete the Google-only profile
 * 4. Return the merged (wallet) profile
 */
export async function POST(request: Request) {
  let body: { walletAddress?: string; googleProfileId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { walletAddress, googleProfileId } = body;

  if (!walletAddress || !googleProfileId) {
    return NextResponse.json(
      { error: "walletAddress and googleProfileId are required" },
      { status: 400 }
    );
  }

  // Verify the caller is the Google user
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== googleProfileId) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Server configuration error: service role key not set." },
      { status: 500 }
    );
  }

  // Fetch both profiles
  const [{ data: walletProfile }, { data: googleProfile }] = await Promise.all([
    serviceClient
      .from("profiles")
      .select("*")
      .eq("id", walletAddress)
      .maybeSingle(),
    serviceClient
      .from("profiles")
      .select("*")
      .eq("id", googleProfileId)
      .maybeSingle(),
  ]);

  if (!walletProfile) {
    // No existing wallet profile — just save the wallet address on the Google profile
    const { error } = await serviceClient
      .from("profiles")
      .update({
        wallet_address: walletAddress,
        updated_at: new Date().toISOString(),
      })
      .eq("id", googleProfileId);

    if (error) {
      console.error("[merge] Error saving wallet address:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ merged: false, profileId: googleProfileId });
  }

  if (!googleProfile) {
    return NextResponse.json({ error: "Google profile not found" }, { status: 404 });
  }

  // Merge: wallet profile is the primary (all existing data references it).
  // Copy Google fields onto the wallet profile.
  const { error: updateError } = await serviceClient
    .from("profiles")
    .update({
      email: googleProfile.email || walletProfile.email,
      google_user_id: googleProfileId,
      avatar_url: walletProfile.avatar_url || googleProfile.avatar_url,
      display_name: walletProfile.display_name || googleProfile.display_name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", walletAddress);

  if (updateError) {
    console.error("[merge] Error updating wallet profile:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Re-point any data created under the Google profile ID to the wallet profile ID.
  // These tables reference profiles by user_id or creator_id.
  const tables = [
    { table: "content_items", column: "creator_id" },
    { table: "content_interactions", column: "user_id" },
    { table: "votes", column: "user_id" },
    { table: "poll_comments", column: "user_id" },
    { table: "comment_upvotes", column: "user_id" },
    { table: "project_members", column: "user_id" },
    { table: "event_rsvps", column: "user_id" },
  ];

  for (const { table, column } of tables) {
    const { error } = await serviceClient
      .from(table)
      .update({ [column]: walletAddress })
      .eq(column, googleProfileId);

    if (error) {
      // Non-fatal — log but continue
      console.error(`[merge] Error migrating ${table}.${column}:`, error.message);
    }
  }

  // Delete the Google-only profile
  const { error: deleteError } = await serviceClient
    .from("profiles")
    .delete()
    .eq("id", googleProfileId);

  if (deleteError) {
    console.error("[merge] Error deleting Google profile:", deleteError.message);
    // Non-fatal — the merge is already done
  }

  console.log(
    `[merge] Merged Google profile ${googleProfileId} into wallet profile ${walletAddress}`
  );

  return NextResponse.json({ merged: true, profileId: walletAddress });
}
