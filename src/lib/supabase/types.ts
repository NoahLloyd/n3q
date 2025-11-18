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


