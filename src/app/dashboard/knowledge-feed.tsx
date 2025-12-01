"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FeedItem } from "@/lib/feed";
import type { Profile } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddItemForm } from "./sections/add-item-form";
import { FeedList } from "./sections/feed-list";
import { HistoryList } from "./sections/history-list";

const supabase = createSupabaseBrowserClient();

async function getProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

// Client-side feed fetching (adapted for text IDs without foreign keys)
async function fetchFeed(userId: string): Promise<FeedItem[]> {
  // Fetch content items
  const { data: items, error } = await supabase
    .from("content_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !items) {
    console.error("Error fetching content items:", error);
    return [];
  }

  // Fetch all interactions for these items
  const itemIds = items.map((item) => item.id);
  const { data: interactions } = await supabase
    .from("content_interactions")
    .select("*")
    .in("item_id", itemIds);

  // Get unique user IDs for profiles
  const creatorIds = [...new Set(items.map((item) => item.creator_id))];
  const interactionUserIds = [
    ...new Set((interactions || []).map((i) => i.user_id)),
  ];
  const allUserIds = [...new Set([...creatorIds, ...interactionUserIds])];

  // Fetch profiles
  const profiles: Record<string, Profile> = {};
  for (const id of allUserIds) {
    const profile = await getProfile(id);
    if (profile) profiles[id] = profile;
  }

  const now = Date.now();

  return items.map((row) => {
    const itemInteractions = (interactions || []).filter(
      (i) => i.item_id === row.id
    );
    const myInteraction = itemInteractions.find((i) => i.user_id === userId);
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

    const comments = itemInteractions
      .filter(
        (i) => typeof i.comment === "string" && i.comment.trim().length > 0
      )
      .map((i) => ({
        id: i.id,
        comment: i.comment as string,
        created_at: i.created_at,
        author_id: i.user_id,
        author_name: profiles[i.user_id]?.display_name ?? null,
        author_avatar_url: profiles[i.user_id]?.avatar_url ?? null,
      }));

    const creator = profiles[row.creator_id];

    return {
      id: row.id,
      creator_id: row.creator_id,
      type: row.type,
      url: row.url,
      title: row.title,
      created_at: row.created_at,
      creator: creator
        ? {
            id: creator.id,
            display_name: creator.display_name,
            avatar_url: creator.avatar_url,
            bio: creator.bio,
            created_at: creator.created_at,
            updated_at: creator.updated_at,
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

async function fetchHistory(userId: string) {
  // Fetch user's interactions
  const { data: interactions, error } = await supabase
    .from("content_interactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !interactions) {
    console.error("Error fetching history:", error);
    return [];
  }

  // Fetch the content items for these interactions
  const itemIds = [...new Set(interactions.map((i) => i.item_id))];
  const { data: items } = await supabase
    .from("content_items")
    .select("*")
    .in("id", itemIds);

  const itemsMap: Record<string, any> = {};
  (items || []).forEach((item) => {
    itemsMap[item.id] = item;
  });

  return interactions.map((interaction) => ({
    ...interaction,
    item: itemsMap[interaction.item_id] || null,
  }));
}

export function KnowledgeFeed() {
  const { address } = useAccount();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userId = address ?? "";

  useEffect(() => {
    if (!address) return;

    const loadData = async () => {
      setIsLoading(true);
      const [feedData, historyData] = await Promise.all([
        fetchFeed(address),
        fetchHistory(address),
      ]);
      setFeed(feedData);
      setHistory(historyData);
      setIsLoading(false);
    };

    loadData();
  }, [address]);

  const refreshData = async () => {
    if (!address) return;
    const [feedData, historyData] = await Promise.all([
      fetchFeed(address),
      fetchHistory(address),
    ]);
    setFeed(feedData);
    setHistory(historyData);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Shared knowledge</h1>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <div className="space-y-4">
          <FeedList
            items={feed}
            currentUserId={userId}
            onRefresh={refreshData}
          />
        </div>
        <div className="space-y-4">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Add to the feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AddItemForm userId={userId} onSuccess={refreshData} />
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryList history={history} filter="saved" />
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryList history={history} filter="done" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
