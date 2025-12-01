"use client";

import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  ListChecks,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Poll } from "@/lib/supabase/types";
import { formatDistanceToNow } from "@/lib/utils";

interface PollCardProps {
  poll: Poll;
  totalMembers: number;
  onRefresh?: () => void;
}

function getResultsDisplay(poll: Poll) {
  if (poll.type === "yes_no_abstain") {
    const total = poll.yes_count + poll.no_count + poll.abstain_count;
    return {
      total,
      bars: [
        { label: "Yes", count: poll.yes_count, color: "bg-emerald-500" },
        { label: "No", count: poll.no_count, color: "bg-red-500" },
        { label: "Abstain", count: poll.abstain_count, color: "bg-zinc-500" },
      ],
    };
  } else {
    const options = poll.options || [];
    const total = options.reduce((sum, opt) => sum + opt.vote_count, 0);
    const colors = [
      "bg-emerald-500",
      "bg-blue-500",
      "bg-amber-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-cyan-500",
    ];
    return {
      total,
      bars: options
        .sort((a, b) => a.position - b.position)
        .map((opt, i) => ({
          label: opt.label,
          count: opt.vote_count,
          color: colors[i % colors.length],
        })),
    };
  }
}

export function PollCard({ poll, totalMembers }: PollCardProps) {
  const results = getResultsDisplay(poll);
  const voteCount = poll.vote_count || results.total;
  const isClosed = poll.status === "closed";

  return (
    <Link href={`/dashboard/voting/${poll.id}`}>
      <Card className="rounded-none hover:border-sidebar-ring transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
              {poll.title}
            </CardTitle>
            {isClosed ? (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Closed
              </Badge>
            ) : (
              <Badge className="shrink-0 text-xs bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            {poll.type === "yes_no_abstain" ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Yes/No/Abstain
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                Multiple Choice
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {voteCount}/{totalMembers}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Results bars */}
          <div className="space-y-2">
            {results.bars.slice(0, 3).map((bar) => {
              const percentage =
                results.total > 0 ? (bar.count / results.total) * 100 : 0;
              return (
                <div key={bar.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate">
                      {bar.label}
                    </span>
                    <span className="font-medium tabular-nums">
                      {bar.count}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted overflow-hidden">
                    <div
                      className={`h-full ${bar.color} transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {results.bars.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{results.bars.length - 3} more options
              </p>
            )}
          </div>

          {/* Winner badge for closed polls */}
          {isClosed && poll.winning_option && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-xs">
                {poll.winning_option === "yes" && (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-emerald-500">Passed</span>
                  </>
                )}
                {poll.winning_option === "no" && (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-500">Rejected</span>
                  </>
                )}
                {poll.winning_option === "tie" && (
                  <>
                    <MinusCircle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-amber-500">Tied</span>
                  </>
                )}
                {!["yes", "no", "tie"].includes(poll.winning_option) && (
                  <span className="font-medium text-foreground truncate">
                    Winner: {poll.winning_option}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Timestamp and creator */}
          <p className="text-xs text-muted-foreground">
            {isClosed && poll.closed_at
              ? `Closed ${formatDistanceToNow(new Date(poll.closed_at))}`
              : `${formatDistanceToNow(new Date(poll.created_at))}`}
            {poll.creator && (
              <span>
                {" "}
                by{" "}
                {poll.creator.display_name ||
                  `${poll.creator_id.slice(0, 6)}...`}
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
