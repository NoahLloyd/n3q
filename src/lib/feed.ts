import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ContentInteraction,
  ContentItem,
  ContentType,
} from "@/lib/supabase/types";

export interface FeedItem extends ContentItem {
  saves_count: number;
  done_count: number;
  avg_rating: number | null;
  score: number;
  my_status: ContentInteraction["status"];
  my_rating: number | null;
  my_comment: string | null;
  comments: {
    id: string;
    comment: string;
    created_at: string;
    author_id: string;
    author_name: string | null;
    author_avatar_url: string | null;
  }[];
}

export async function addContentItem(input: {
  creatorId: string;
  type: ContentType;
  url?: string | null;
  title: string;
}): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("content_items").insert({
    creator_id: input.creatorId,
    type: input.type,
    url: input.url ?? null,
    title: input.title,
  });

  if (error) {
    console.error("Error adding content item:", error);
    return { error: error.message };
  }

  return {};
}

export async function upsertInteraction(input: {
  userId: string;
  itemId: string;
  status?: ContentInteraction["status"];
  rating?: number | null;
  comment?: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();

  const { data: existing } = await supabase
    .from("content_interactions")
    .select("*")
    .eq("user_id", input.userId)
    .eq("item_id", input.itemId)
    .maybeSingle<ContentInteraction>();

  const payload = {
    user_id: input.userId,
    item_id: input.itemId,
    status: input.status ?? existing?.status ?? null,
    rating:
      typeof input.rating === "number"
        ? input.rating
        : existing?.rating ?? null,
    comment:
      typeof input.comment === "string"
        ? input.comment
        : existing?.comment ?? null,
  };

  const { error } = existing
    ? await supabase
        .from("content_interactions")
        .update(payload)
        .eq("id", existing.id)
    : await supabase.from("content_interactions").insert(payload);

  if (error) {
    console.error("Error upserting interaction:", error);
    return { error: error.message };
  }

  return {};
}

type InteractionWithProfile = ContentInteraction & {
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type FeedRow = ContentItem & {
  profiles?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  content_interactions: InteractionWithProfile[] | null;
};

export async function getFeed(userId: string): Promise<FeedItem[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("content_items")
    .select(
      `
        id,
        creator_id,
        type,
        url,
        title,
        ai_title,
        ai_subtitle,
        site_name,
        author,
        description,
        summary,
        topics,
        ai_notes,
        created_at,
        profiles (
          id,
          display_name,
          avatar_url
        ),
        content_interactions (
          id,
          user_id,
          status,
          rating,
          comment,
          created_at,
          profiles (
            id,
            display_name,
            avatar_url
          )
        )
      `
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching feed:", error);
    return [];
  }

  const rows = data as unknown as FeedRow[];
  const now = Date.now();

  return rows.map((row) => {
    const interactions = row.content_interactions ?? [];

    const myInteraction = interactions.find((i) => i.user_id === userId);

    const savesCount = interactions.filter((i) => i.status === "saved").length;
    const doneCount = interactions.filter((i) => i.status === "done").length;
    const ratings = interactions
      .map((i) => i.rating)
      .filter((r): r is number => typeof r === "number");
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((acc, r) => acc + r, 0) / ratings.length
        : null;

    const ageHours =
      (now - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
    const baseScore = savesCount * 1 + doneCount * 2 + (avgRating ?? 0) * 1.5;
    const decayFactor = 1 / (1 + ageHours / 24);
    const score = baseScore * decayFactor;

    const comments =
      interactions
        .filter(
          (i) => typeof i.comment === "string" && i.comment.trim().length > 0
        )
        .map((i) => ({
          id: i.id,
          comment: i.comment as string,
          created_at: i.created_at,
          author_id: i.user_id,
          author_name: i.profiles?.display_name ?? null,
          author_avatar_url: i.profiles?.avatar_url ?? null,
        })) ?? [];

    return {
      id: row.id,
      creator_id: row.creator_id,
      type: row.type,
      url: row.url,
      title: row.title,
      ai_title: row.ai_title,
      ai_subtitle: row.ai_subtitle,
      site_name: row.site_name,
      author: row.author,
      description: row.description,
      summary: row.summary,
      topics: row.topics,
      ai_notes: row.ai_notes,
      created_at: row.created_at,
      creator: row.profiles
        ? {
            id: row.profiles.id,
            display_name: row.profiles.display_name,
            avatar_url: row.profiles.avatar_url,
            bio: null,
            created_at: "",
            updated_at: "",
          }
        : undefined,
      saves_count: savesCount,
      done_count: doneCount,
      avg_rating: avgRating,
      score,
      my_status: myInteraction?.status ?? null,
      my_rating: myInteraction?.rating ?? null,
      my_comment: myInteraction?.comment ?? null,
      comments,
    };
  });
}

type HistoryRow = ContentInteraction & {
  item: ContentItem | ContentItem[] | null;
};

export async function getHistory(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("content_interactions")
    .select(
      `
        id,
        status,
        rating,
        comment,
        created_at,
        item:content_items (
          id,
          title,
          type,
          url,
          created_at
        )
      `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching history:", error);
    return [];
  }

  const rows = data as HistoryRow[];
  return rows.map((row) => ({
    ...row,
    item: Array.isArray(row.item) ? row.item[0] ?? null : row.item,
  }));
}
