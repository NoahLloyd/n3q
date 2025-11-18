import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Sidebar } from "./sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    profile?.display_name ??
    (user.user_metadata?.display_name as string | undefined) ??
    "Member";

  const avatarUrl =
    profile?.avatar_url ??
    (user.user_metadata?.avatar_url as string | undefined) ??
    undefined;

  const initials =
    (displayName || "")
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "N3";

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        displayName={displayName}
        avatarUrl={avatarUrl}
        initials={initials}
      />
      <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
