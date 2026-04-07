export type ContentType =
  | "article"
  | "blog"
  | "book"
  | "podcast"
  | "video"
  | "paper"
  | "newsletter"
  | "report"
  | "dataset"
  | "tool"
  | "course"
  | "event"
  | "community"
  | "other";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  wallet_address: string | null;
  email: string | null;
  auth_method: "wallet" | "google";
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  google_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentItem {
  id: string;
  creator_id: string;
  type: ContentType;
  url: string | null;
  title: string;
  ai_title?: string | null;
  ai_subtitle?: string | null;
  site_name?: string | null;
  author?: string | null;
  description?: string | null;
  summary?: string | null;
  topics?: string[] | null;
  ai_notes?: Record<string, unknown> | null;
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

// Project types
export type ProjectStatus = "idea" | "in_progress" | "looking_for_help" | "completed";

export interface Project {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  creator?: Profile;
  member_count?: number;
  members?: ProjectMember[];
  user_is_member?: boolean;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  joined_at: string;
  user?: Profile;
}

// Event types
export interface Event {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string; // YYYY-MM-DD
  event_time: string | null; // HH:MM:SS or null for all-day
  event_end_time: string | null; // HH:MM:SS or null
  is_public: boolean;
  ical_uid?: string | null;
  created_at: string;
  creator?: Profile;
  rsvp_count?: number;
  rsvps?: EventRsvp[];
  rsvp_profiles?: Profile[];
  user_has_rsvp?: boolean;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  created_at: string;
  user?: Profile;
}
