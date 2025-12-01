"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAccount } from "wagmi";
import { useAllMembers } from "@/lib/web3/hooks";
import { fetchPolls } from "@/lib/supabase/polls";
import type { Poll } from "@/lib/supabase/types";
import { PollCard } from "../components/poll-card";

export default function VotingArchivePage() {
  const { address } = useAccount();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { totalSupply } = useAllMembers();

  useEffect(() => {
    const loadPolls = async () => {
      if (!address) return;
      try {
        const data = await fetchPolls(address);
        // Filter to only closed polls
        const closedPolls = data.filter((p) => p.status === "closed");
        setPolls(closedPolls);
      } catch (error) {
        console.error("Error fetching polls:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPolls();
  }, [address]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="space-y-1">
        <Link
          href="/dashboard/voting"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Voting
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">Closed Polls</h1>
        <p className="text-sm text-muted-foreground">
          {polls.length} poll{polls.length !== 1 ? "s" : ""} in the archive
        </p>
      </div>

      {polls.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No closed polls yet. Polls close automatically when the outcome becomes certain.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              totalMembers={totalSupply || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
