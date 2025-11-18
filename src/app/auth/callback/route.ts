import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Error exchanging code for session", error.message);
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Ensure a profile row exists for this user so foreign keys from content_items
  // and content_interactions succeed.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!userError && user) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
      },
      { onConflict: "id" },
    );
  }

  return NextResponse.redirect(new URL("/app", request.url));
}


