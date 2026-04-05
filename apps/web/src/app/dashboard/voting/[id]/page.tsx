"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ListChecks,
  Users,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useAllMembers } from "@/lib/web3/hooks";
import { fetchPoll, deletePoll, castVote, fetchComments } from "@/lib/supabase/polls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Poll, PollComment, YesNoAbstainVote } from "@/lib/supabase/types";
import { formatDistanceToNow } from "@/lib/utils";
import { CommentSection } from "../components/comment-section";

interface PollDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PollDetailPage({ params }: PollDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { userId: address } = useAuth();
  const { totalSupply } = useAllMembers();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [comments, setComments] = useState<PollComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVote, setSelectedVote] = useState<YesNoAbstainVote | string | null>(null);

  const userId = address || "";

  const loadPoll = async () => {
    if (!address) return;
    try {
      const data = await fetchPoll(id, address);
      setPoll(data);
    } catch (error) {
      console.error("Error fetching poll:", error);
    }
  };

  const loadComments = async () => {
    if (!address) return;
    try {
      const data = await fetchComments(id, address);
      setComments(data);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([loadPoll(), loadComments()]);
      setIsLoading(false);
    };
    if (address) {
      loadData();
    }
  }, [id, address]);

  const handleVote = async () => {
    if (!selectedVote || !poll || !totalSupply || !address) return;

    setIsVoting(true);
    try {
      const vote = poll.type === "yes_no_abstain" ? (selectedVote as YesNoAbstainVote) : null;
      const optionId = poll.type === "multiple_choice" ? selectedVote : null;

      const updatedPoll = await castVote(id, address, vote, optionId, totalSupply);
      if (updatedPoll) {
        setPoll(updatedPoll);
        setSelectedVote(null);
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert(error instanceof Error ? error.message : "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this poll?") || !address) return;

    setIsDeleting(true);
    try {
      await deletePoll(id, address);
      router.push("/dashboard/voting");
    } catch (error) {
      console.error("Error deleting poll:", error);
      alert(error instanceof Error ? error.message : "Failed to delete poll");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-muted-foreground">Poll not found</p>
        <Link href="/dashboard/voting">
          <Button variant="outline" size="sm">
            Back to Voting
          </Button>
        </Link>
      </div>
    );
  }

  const isClosed = poll.status === "closed";
  const hasVoted = poll.user_has_voted;
  const isCreator = poll.creator_id === address;
  const voteCount = poll.vote_count || 0;
  const totalMembers = totalSupply || 0;
  const remaining = totalMembers - voteCount;

  // Calculate results for display
  const getResults = () => {
    if (poll.type === "yes_no_abstain") {
      const total = poll.yes_count + poll.no_count + poll.abstain_count;
      return [
        { id: "yes", label: "Yes", count: poll.yes_count, color: "bg-amber-500", textColor: "text-amber-500" },
        { id: "no", label: "No", count: poll.no_count, color: "bg-red-500", textColor: "text-red-500" },
        { id: "abstain", label: "Abstain", count: poll.abstain_count, color: "bg-zinc-500", textColor: "text-zinc-500" },
      ].map((opt) => ({ ...opt, percentage: total > 0 ? (opt.count / total) * 100 : 0 }));
    } else {
      const options = poll.options || [];
      const total = options.reduce((sum, opt) => sum + opt.vote_count, 0);
      const colors = [
        { bg: "bg-amber-500", text: "text-amber-500" },
        { bg: "bg-blue-500", text: "text-blue-500" },
        { bg: "bg-amber-500", text: "text-amber-500" },
        { bg: "bg-purple-500", text: "text-purple-500" },
        { bg: "bg-pink-500", text: "text-pink-500" },
        { bg: "bg-cyan-500", text: "text-cyan-500" },
      ];
      return options
        .sort((a, b) => a.position - b.position)
        .map((opt, i) => ({
          id: opt.id,
          label: opt.label,
          count: opt.vote_count,
          color: colors[i % colors.length].bg,
          textColor: colors[i % colors.length].text,
          percentage: total > 0 ? (opt.vote_count / total) * 100 : 0,
        }));
    }
  };

  const results = getResults();

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/voting"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Voting
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">{poll.title}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
              {voteCount}/{totalMembers} voted
            </span>
            {isClosed ? (
              <Badge variant="secondary" className="text-xs">
                Closed
              </Badge>
            ) : (
              <Badge className="text-xs bg-amber-500/20 text-amber-500 border-amber-500/30">
                Active
              </Badge>
            )}
          </div>
        </div>
        {isCreator && !isClosed && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Description */}
      {poll.description && (
        <p className="text-sm text-muted-foreground">{poll.description}</p>
      )}

      {/* Results & Voting */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            {isClosed ? "Final Results" : hasVoted ? "Current Results" : "Cast Your Vote"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Winner banner for closed polls */}
          {isClosed && poll.winning_option && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 border border-border">
              {poll.winning_option === "yes" && (
                <>
                  <CheckCircle2 className="h-5 w-5 text-amber-500" />
                  <span className="font-medium text-amber-500">Passed</span>
                </>
              )}
              {poll.winning_option === "no" && (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-500">Rejected</span>
                </>
              )}
              {poll.winning_option === "tie" && (
                <>
                  <MinusCircle className="h-5 w-5 text-amber-500" />
                  <span className="font-medium text-amber-500">Tied</span>
                </>
              )}
              {!["yes", "no", "tie"].includes(poll.winning_option) && (
                <span className="font-medium">Winner: {poll.winning_option}</span>
              )}
            </div>
          )}

          {/* Vote options */}
          <div className="space-y-3">
            {results.map((option) => {
              const canSelect = !isClosed && !hasVoted;
              const isSelected = selectedVote === option.id;

              return (
                <div key={option.id} className="space-y-2">
                  <button
                    type="button"
                    disabled={!canSelect}
                    onClick={() => canSelect && setSelectedVote(option.id)}
                    className={`w-full text-left p-3 border transition-colors ${
                      canSelect
                        ? isSelected
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-border hover:border-muted-foreground"
                        : "border-border cursor-default"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${isSelected ? option.textColor : ""}`}>
                        {option.label}
                      </span>
                      <span className="text-sm tabular-nums">
                        {option.count} ({option.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted overflow-hidden">
                      <div
                        className={`h-full ${option.color} transition-all duration-500`}
                        style={{ width: `${option.percentage}%` }}
                      />
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Vote button */}
          {!isClosed && !hasVoted && (
            <Button
              onClick={handleVote}
              disabled={!selectedVote || isVoting}
              className="w-full"
            >
              {isVoting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Vote"
              )}
            </Button>
          )}

          {hasVoted && !isClosed && (
            <p className="text-xs text-center text-muted-foreground">
              You have voted. {remaining} member{remaining !== 1 ? "s" : ""} remaining.
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">
            {isClosed && poll.closed_at
              ? `Closed ${formatDistanceToNow(new Date(poll.closed_at))}`
              : `Created ${formatDistanceToNow(new Date(poll.created_at))}`}
            {poll.creator && ` by ${poll.creator.display_name || "Anonymous"}`}
          </p>
        </CardContent>
      </Card>

      {/* Comments */}
      <CommentSection
        pollId={id}
        userId={userId}
        comments={comments}
        onRefresh={loadComments}
      />
    </div>
  );
}
