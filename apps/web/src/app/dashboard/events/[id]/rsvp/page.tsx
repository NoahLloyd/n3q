"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { rsvpEvent } from "@/lib/supabase/events";
import { Loader2 } from "lucide-react";

export default function RsvpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { userId, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (!isAuthenticated || !userId || !id) return;

    rsvpEvent(id, userId)
      .then(() => setStatus("done"))
      .catch(() => setStatus("done")) // Already RSVP'd is fine
      .finally(() => {
        router.replace(`/dashboard/events/${id}`);
      });
  }, [isAuthenticated, userId, id, router]);

  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {status === "loading" ? "RSVPing..." : "Redirecting..."}
      </div>
    </div>
  );
}
