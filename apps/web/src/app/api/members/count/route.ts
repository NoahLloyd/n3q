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

  const { count, error } = await serviceClient
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("is_verified", true);

  if (error) {
    console.error("[members/count] Error:", error.message);
    return NextResponse.json({ error: "Failed to count members" }, { status: 500 });
  }

  return NextResponse.json({ count: count || 0 });
}
