import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Poll,
  PollComment,
  PollType,
  YesNoAbstainVote,
  Profile,
} from "../types";

async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function fetchPolls(supabase: SupabaseClient, userId: string): Promise<Poll[]> {
  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching polls:", error);
    return [];
  }

  // Fetch options for all polls
  const pollIds = (polls || []).map((p) => p.id);
  const { data: allOptions } = await supabase
    .from("poll_options")
    .select("*")
    .in("poll_id", pollIds);

  // Get vote counts and check if user has voted for each poll
  const pollsWithInfo = await Promise.all(
    (polls || []).map(async (poll) => {
      const { count: voteCount } = await supabase
        .from("votes")
        .select("*", { count: "exact", head: true })
        .eq("poll_id", poll.id);

      const { data: userVote } = await supabase
        .from("votes")
        .select("id")
        .eq("poll_id", poll.id)
        .eq("user_id", userId)
        .maybeSingle();

      const creator = await getProfile(supabase, poll.creator_id);
      const options = (allOptions || []).filter((o) => o.poll_id === poll.id);

      return {
        ...poll,
        creator,
        options,
        vote_count: voteCount || 0,
        user_has_voted: !!userVote,
      };
    })
  );

  return pollsWithInfo;
}

export async function fetchPoll(
  supabase: SupabaseClient,
  pollId: string,
  userId: string
): Promise<Poll | null> {
  const { data: poll, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (error) {
    console.error("Error fetching poll:", error);
    return null;
  }

  // Fetch options
  const { data: options } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  const { count: voteCount } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("poll_id", pollId);

  const { data: userVote } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .maybeSingle();

  const creator = await getProfile(supabase, poll.creator_id);

  return {
    ...poll,
    creator,
    options: options || [],
    vote_count: voteCount || 0,
    user_has_voted: !!userVote,
  };
}

export async function createPoll(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  description: string | null,
  type: PollType,
  options?: string[]
): Promise<Poll | null> {
  // Ensure profile exists
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  // Create the poll
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      creator_id: userId,
      title,
      description,
      type,
    })
    .select()
    .single();

  if (pollError) {
    console.error("Error creating poll:", pollError);
    throw new Error(pollError.message);
  }

  // If multiple choice, create the options
  if (type === "multiple_choice" && options && options.length > 0) {
    const optionsToInsert = options.map((label, index) => ({
      poll_id: poll.id,
      label,
      position: index,
    }));

    const { error: optionsError } = await supabase
      .from("poll_options")
      .insert(optionsToInsert);

    if (optionsError) {
      console.error("Error creating poll options:", optionsError);
      // Clean up the poll
      await supabase.from("polls").delete().eq("id", poll.id);
      throw new Error(optionsError.message);
    }
  }

  return fetchPoll(supabase, poll.id, userId);
}

export async function deletePoll(
  supabase: SupabaseClient,
  pollId: string,
  userId: string
): Promise<boolean> {
  // Verify ownership
  const { data: poll } = await supabase
    .from("polls")
    .select("creator_id")
    .eq("id", pollId)
    .single();

  if (!poll || poll.creator_id !== userId) {
    throw new Error("Only the poll creator can delete this poll");
  }

  const { error } = await supabase.from("polls").delete().eq("id", pollId);

  if (error) {
    console.error("Error deleting poll:", error);
    throw new Error(error.message);
  }

  return true;
}

async function checkAutoClose(
  supabase: SupabaseClient,
  pollId: string,
  totalMembers: number
): Promise<{ shouldClose: boolean; winner?: string }> {
  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (!poll || poll.status === "closed") {
    return { shouldClose: false };
  }

  const { data: options } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", pollId);

  const { count: votesCast } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("poll_id", pollId);

  const remaining = totalMembers - (votesCast || 0);

  if (poll.type === "yes_no_abstain") {
    const { yes_count, no_count } = poll;

    if (yes_count > no_count + remaining) {
      return { shouldClose: true, winner: "yes" };
    }

    if (no_count > yes_count + remaining) {
      return { shouldClose: true, winner: "no" };
    }

    if (remaining === 0) {
      if (yes_count > no_count) {
        return { shouldClose: true, winner: "yes" };
      } else if (no_count > yes_count) {
        return { shouldClose: true, winner: "no" };
      } else {
        return { shouldClose: true, winner: "tie" };
      }
    }
  } else if (poll.type === "multiple_choice") {
    const pollOptions = options || [];
    if (pollOptions.length === 0) {
      return { shouldClose: false };
    }

    const sortedOptions = [...pollOptions].sort(
      (a, b) => b.vote_count - a.vote_count
    );
    const leader = sortedOptions[0];
    const secondPlace = sortedOptions[1];

    if (secondPlace && leader.vote_count > secondPlace.vote_count + remaining) {
      return { shouldClose: true, winner: leader.label };
    }

    if (remaining === 0) {
      if (!secondPlace || leader.vote_count > secondPlace.vote_count) {
        return { shouldClose: true, winner: leader.label };
      } else if (leader.vote_count === secondPlace.vote_count) {
        return { shouldClose: true, winner: "tie" };
      }
    }
  }

  return { shouldClose: false };
}

export async function castVote(
  supabase: SupabaseClient,
  pollId: string,
  userId: string,
  vote: YesNoAbstainVote | null,
  optionId: string | null,
  totalMembers: number
): Promise<Poll | null> {
  // Get the poll
  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (!poll) {
    throw new Error("Poll not found");
  }

  if (poll.status === "closed") {
    throw new Error("Poll is closed");
  }

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingVote) {
    throw new Error("You have already voted on this poll");
  }

  // Ensure profile exists
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  if (poll.type === "yes_no_abstain") {
    if (!vote || !["yes", "no", "abstain"].includes(vote)) {
      throw new Error("Invalid vote. Must be yes, no, or abstain");
    }

    // Record the vote
    const { error: voteError } = await supabase
      .from("votes")
      .insert({ poll_id: pollId, user_id: userId });

    if (voteError) {
      console.error("Error recording vote:", voteError);
      throw new Error(voteError.message);
    }

    // Increment the appropriate counter
    const updateField = `${vote}_count`;
    const { error: updateError } = await supabase
      .from("polls")
      .update({
        [updateField]: (poll as Record<string, number>)[updateField] + 1,
      })
      .eq("id", pollId);

    if (updateError) {
      console.error("Error updating vote count:", updateError);
      throw new Error(updateError.message);
    }
  } else if (poll.type === "multiple_choice") {
    if (!optionId) {
      throw new Error("Option ID is required for multiple choice polls");
    }

    // Verify option belongs to this poll
    const { data: option } = await supabase
      .from("poll_options")
      .select("*")
      .eq("id", optionId)
      .eq("poll_id", pollId)
      .single();

    if (!option) {
      throw new Error("Invalid option");
    }

    // Record the vote
    const { error: voteError } = await supabase
      .from("votes")
      .insert({ poll_id: pollId, user_id: userId });

    if (voteError) {
      console.error("Error recording vote:", voteError);
      throw new Error(voteError.message);
    }

    // Increment the option's vote count
    const { error: updateError } = await supabase
      .from("poll_options")
      .update({ vote_count: option.vote_count + 1 })
      .eq("id", optionId);

    if (updateError) {
      console.error("Error updating option vote count:", updateError);
      throw new Error(updateError.message);
    }
  }

  // Check for auto-close
  const { shouldClose, winner } = await checkAutoClose(supabase, pollId, totalMembers);

  if (shouldClose && winner) {
    await supabase
      .from("polls")
      .update({
        status: "closed",
        winning_option: winner,
        closed_at: new Date().toISOString(),
      })
      .eq("id", pollId);
  }

  return fetchPoll(supabase, pollId, userId);
}

export async function fetchComments(
  supabase: SupabaseClient,
  pollId: string,
  userId: string
): Promise<PollComment[]> {
  const { data: comments, error } = await supabase
    .from("poll_comments")
    .select("*")
    .eq("poll_id", pollId)
    .order("upvote_count", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching comments:", error);
    return [];
  }

  // Fetch user profiles for comments
  const userIds = [...new Set((comments || []).map((c) => c.user_id))];
  const profiles: Record<string, Profile> = {};

  for (const id of userIds) {
    const profile = await getProfile(supabase, id);
    if (profile) profiles[id] = profile;
  }

  // Check which comments the user has upvoted
  const { data: userUpvotes } = await supabase
    .from("comment_upvotes")
    .select("comment_id")
    .eq("user_id", userId);

  const upvotedCommentIds = new Set(
    userUpvotes?.map((u) => u.comment_id) || []
  );

  return (comments || []).map((comment) => ({
    ...comment,
    user: profiles[comment.user_id] || null,
    user_has_upvoted: upvotedCommentIds.has(comment.id),
  }));
}

export async function addComment(
  supabase: SupabaseClient,
  pollId: string,
  userId: string,
  content: string
): Promise<PollComment | null> {
  // Ensure profile exists
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  const { data: comment, error } = await supabase
    .from("poll_comments")
    .insert({
      poll_id: pollId,
      user_id: userId,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating comment:", error);
    throw new Error(error.message);
  }

  const user = await getProfile(supabase, userId);

  return {
    ...comment,
    user,
    user_has_upvoted: false,
  };
}

export async function toggleUpvote(
  supabase: SupabaseClient,
  commentId: string,
  userId: string
): Promise<{ upvoted: boolean; upvote_count: number }> {
  // Check if comment exists
  const { data: comment } = await supabase
    .from("poll_comments")
    .select("*")
    .eq("id", commentId)
    .single();

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Check if user has already upvoted
  const { data: existingUpvote } = await supabase
    .from("comment_upvotes")
    .select("*")
    .eq("comment_id", commentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingUpvote) {
    // Remove the upvote
    await supabase
      .from("comment_upvotes")
      .delete()
      .eq("comment_id", commentId)
      .eq("user_id", userId);

    await supabase
      .from("poll_comments")
      .update({ upvote_count: comment.upvote_count - 1 })
      .eq("id", commentId);

    return {
      upvoted: false,
      upvote_count: comment.upvote_count - 1,
    };
  } else {
    // Ensure profile exists
    await supabase
      .from("profiles")
      .upsert({ id: userId }, { onConflict: "id" });

    // Add the upvote
    await supabase.from("comment_upvotes").insert({
      comment_id: commentId,
      user_id: userId,
    });

    await supabase
      .from("poll_comments")
      .update({ upvote_count: comment.upvote_count + 1 })
      .eq("id", commentId);

    return {
      upvoted: true,
      upvote_count: comment.upvote_count + 1,
    };
  }
}
