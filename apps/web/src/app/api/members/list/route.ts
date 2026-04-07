import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

export async function GET() {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const { data: members, error } = await serviceClient
    .from("profiles")
    .select("id, display_name, avatar_url, bio, wallet_address, created_at")
    .eq("is_verified", true)
    .order("display_name", { ascending: true });

  if (error) {
    console.error("[members/list] Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }

  return NextResponse.json({ members: members || [] });
}
