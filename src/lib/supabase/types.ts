export type ContentType =
  | "article"
  | "book"
  | "blog"
  | "podcast"
  | "video"
  | "other";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  creator_id: string;
  type: ContentType;
  url: string | null;
  title: string;
  created_at: string;
  creator?: Profile;
  score?: number;
  saves_count?: number;
  done_count?: number;
  avg_rating?: number | null;
}

export type InteractionStatus = "saved" | "done";

export interface ContentInteraction {
  id: string;
  user_id: string;
  item_id: string;
  status: InteractionStatus | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

// Voting types
export type PollType = "yes_no_abstain" | "multiple_choice";
export type PollStatus = "active" | "closed";
export type YesNoAbstainVote = "yes" | "no" | "abstain";

export interface Poll {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  type: PollType;
  status: PollStatus;
  yes_count: number;
  no_count: number;
  abstain_count: number;
  winning_option: string | null;
  closed_at: string | null;
  created_at: string;
  creator?: Profile;
  options?: PollOption[];
  vote_count?: number;
  user_has_voted?: boolean;
}

export interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  vote_count: number;
  position: number;
}

export interface Vote {
  id: string;
  poll_id: string;
  user_id: string;
  created_at: string;
}

export interface PollComment {
  id: string;
  poll_id: string;
  user_id: string;
  content: string;
  upvote_count: number;
  created_at: string;
  user?: Profile;
  user_has_upvoted?: boolean;
}

export interface CommentUpvote {
  comment_id: string;
  user_id: string;
  created_at: string;
}


