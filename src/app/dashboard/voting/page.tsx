"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Archive } from "lucide-react";
import { useAccount } from "wagmi";
import { useAllMembers } from "@/lib/web3/hooks";
import { fetchPolls } from "@/lib/supabase/polls";
import { Button } from "@/components/ui/button";
import type { Poll } from "@/lib/supabase/types";
import { PollCard } from "./components/poll-card";

export default function VotingPage() {
  const { address } = useAccount();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { totalSupply } = useAllMembers();

  const loadPolls = async () => {
    if (!address) return;
    try {
      const data = await fetchPolls(address);
      setPolls(data);
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, [address]);

  const activePolls = polls.filter((p) => p.status === "active");
  const recentlyClosedPolls = polls
    .filter((p) => p.status === "closed")
    .filter((p) => {
      if (!p.closed_at) return false;
      const closedAt = new Date(p.closed_at);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      return closedAt > threeDaysAgo;
    })
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Voting</h1>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/voting/archive">
            <Button variant="outline" size="sm" className="gap-2">
              <Archive className="h-4 w-4" />
              Archive
            </Button>
          </Link>
          <Link href="/dashboard/voting/create">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Poll
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Polls */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Active Polls
        </h2>
        {activePolls.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No active polls right now.
            </p>
            <Link href="/dashboard/voting/create">
              <Button variant="link" size="sm" className="mt-2">
                Start a new poll
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activePolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                totalMembers={totalSupply || 0}
                onRefresh={loadPolls}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recently Closed */}
      {recentlyClosedPolls.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Recently Closed
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyClosedPolls.map((poll) => (
              <PollCard
                key={poll.id}
                poll={poll}
                totalMembers={totalSupply || 0}
                onRefresh={loadPolls}
              />
            ))}
          </div>
          {polls.filter((p) => p.status === "closed").length > 3 && (
            <Link href="/dashboard/voting/archive">
              <Button variant="link" size="sm">
                View all closed polls
              </Button>
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
