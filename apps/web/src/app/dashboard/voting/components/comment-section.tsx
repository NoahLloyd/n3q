"use client";

import { useState } from "react";
import { ChevronUp, Loader2, MessageSquare } from "lucide-react";
import { addComment, toggleUpvote } from "@/lib/supabase/polls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PollComment } from "@/lib/supabase/types";
import { formatDistanceToNow } from "@/lib/utils";

interface CommentSectionProps {
  pollId: string;
  userId: string;
  comments: PollComment[];
  onRefresh: () => void;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function CommentSection({ pollId, userId, comments, onRefresh }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upvotingCommentId, setUpvotingCommentId] = useState<string | null>(null);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !userId) return;

    setIsSubmitting(true);
    try {
      await addComment(pollId, userId, newComment.trim());
      setNewComment("");
      onRefresh();
    } catch (error) {
      console.error("Error posting comment:", error);
      alert(error instanceof Error ? error.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (commentId: string) => {
    if (!userId) return;
    
    setUpvotingCommentId(commentId);
    try {
      await toggleUpvote(commentId, userId);
      onRefresh();
    } catch (error) {
      console.error("Error upvoting comment:", error);
    } finally {
      setUpvotingCommentId(null);
    }
  };

  return (
    <Card className="rounded-none">
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Discussion ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add comment form */}
        <div className="space-y-2">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none rounded-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Posting...
                </>
              ) : (
                "Post Comment"
              )}
            </Button>
          </div>
        </div>

        {/* Comments list */}
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first to share your thoughts.
          </p>
        ) : (
          <div className="space-y-3 pt-2 border-t border-border">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                {/* Upvote button */}
                <button
                  type="button"
                  onClick={() => handleUpvote(comment.id)}
                  disabled={upvotingCommentId === comment.id}
                  className={`flex flex-col items-center gap-0.5 pt-1 transition-colors ${
                    comment.user_has_upvoted
                      ? "text-amber-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {upvotingCommentId === comment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                  <span className="text-xs font-medium tabular-nums">
                    {comment.upvote_count}
                  </span>
                </button>

                {/* Comment content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={comment.user?.avatar_url || undefined} />
                      <AvatarFallback className="text-[8px]">
                        {getInitials(comment.user?.display_name || null)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">
                      {comment.user?.display_name || "Anonymous"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.created_at))}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
