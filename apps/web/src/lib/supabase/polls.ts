import { createSupabaseBrowserClient } from "./client";
import {
  fetchPolls as _fetchPolls,
  fetchPoll as _fetchPoll,
  createPoll as _createPoll,
  deletePoll as _deletePoll,
  castVote as _castVote,
  fetchComments as _fetchComments,
  addComment as _addComment,
  toggleUpvote as _toggleUpvote,
} from "@n3q/shared";
import type { Poll, PollComment, PollType, YesNoAbstainVote } from "@n3q/shared";

const supabase = createSupabaseBrowserClient();

export async function fetchPolls(userId: string): Promise<Poll[]> {
  return _fetchPolls(supabase, userId);
}

export async function fetchPoll(pollId: string, userId: string): Promise<Poll | null> {
  return _fetchPoll(supabase, pollId, userId);
}

export async function createPoll(
  userId: string,
  title: string,
  description: string | null,
  type: PollType,
  options?: string[]
): Promise<Poll | null> {
  return _createPoll(supabase, userId, title, description, type, options);
}

export async function deletePoll(pollId: string, userId: string): Promise<boolean> {
  return _deletePoll(supabase, pollId, userId);
}

export async function castVote(
  pollId: string,
  userId: string,
  vote: YesNoAbstainVote | null,
  optionId: string | null,
  totalMembers: number
): Promise<Poll | null> {
  return _castVote(supabase, pollId, userId, vote, optionId, totalMembers);
}

export async function fetchComments(pollId: string, userId: string): Promise<PollComment[]> {
  return _fetchComments(supabase, pollId, userId);
}

export async function addComment(
  pollId: string,
  userId: string,
  content: string
): Promise<PollComment | null> {
  return _addComment(supabase, pollId, userId, content);
}

export async function toggleUpvote(
  commentId: string,
  userId: string
): Promise<{ upvoted: boolean; upvote_count: number }> {
  return _toggleUpvote(supabase, commentId, userId);
}
