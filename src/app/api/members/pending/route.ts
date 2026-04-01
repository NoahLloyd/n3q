import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

export async function GET() {
  const serviceClient = createSupabaseServiceClient();
  if (!serviceClient) {
    return NextResponse.json(
      { error: "Service client not configured" },
      { status: 500 }
    );
  }

  const { data, error } = await serviceClient
    .from("profiles")
    .select("id, display_name, email, avatar_url, auth_method, created_at")
    .eq("is_verified", false)
    .eq("auth_method", "google")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching pending members:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
