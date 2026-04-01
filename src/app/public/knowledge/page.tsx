"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FeedItem } from "@/lib/feed";
import type { Profile } from "@/lib/supabase/types";
import { FeedList } from "@/app/dashboard/sections/feed-list";
import { PublicViewBanner } from "@/components/public-view-banner";

const supabase = createSupabaseBrowserClient();

async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function fetchPublicFeed(): Promise<FeedItem[]> {
  // Fetch content items
  const { data: items, error } = await supabase
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !items) {
    console.error("Error fetching content items:", error);
    return [];
  }

  // Fetch all interactions for these items (to show counts)
  const itemIds = items.map((item) => item.id);
  const { data: interactions } = await supabase
    .from("content_interactions")
    .select("*")
    .in("item_id", itemIds);

  // Get unique user IDs for profiles (for comment counts)
  const interactionUserIds = [
    ...new Set((interactions || []).map((i) => i.user_id)),
  ];

  // Fetch profiles for interactions
  const profiles: Record<string, Profile> = {};
  for (const id of interactionUserIds) {
    const profile = await getProfile(id);
    if (profile) profiles[id] = profile;
  }

  const now = Date.now();

  return items.map((row) => {
    const itemInteractions = (interactions || []).filter(
      (i) => i.item_id === row.id
    );
    const savesCount = itemInteractions.filter(
      (i) => i.status === "saved"
    ).length;
    const doneCount = itemInteractions.filter(
      (i) => i.status === "done"
    ).length;
    const ratings = itemInteractions
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

    // Count comments but don't expose their content
    const commentCount = itemInteractions.filter(
      (i) => typeof i.comment === "string" && i.comment.trim().length > 0
    ).length;

    // Create placeholder comments array with just the count
    const comments = Array.from({ length: commentCount }, (_, idx) => ({
      id: `placeholder-${idx}`,
      comment: "",
      created_at: "",
      author_id: "",
      author_name: null,
      author_avatar_url: null,
    }));

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
      creator: undefined, // Don't expose creator for public view
      saves_count: savesCount,
      done_count: doneCount,
      avg_rating: avgRating,
      score,
      my_status: null,
      my_rating: null,
      my_comment: null,
      comments,
    };
  });
}

export default function PublicKnowledgePage() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const feedData = await fetchPublicFeed();
      setFeed(feedData);
      setIsLoading(false);
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <h1 className="text-xl font-semibold tracking-tight">
          Shared knowledge
        </h1>

        <PublicViewBanner itemType="knowledge" />

        <FeedList items={feed} currentUserId="" isPublic />
      </div>
    </div>
  );
}
