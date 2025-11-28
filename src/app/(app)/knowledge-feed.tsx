"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FeedItem } from "@/lib/feed";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddItemForm } from "./sections/add-item-form";
import { FeedList } from "./sections/feed-list";
import { HistoryList } from "./sections/history-list";

const supabase = createSupabaseBrowserClient();

// Client-side feed fetching (adapted from server-side getFeed)
async function fetchFeed(userId: string): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from("content_items")
    .select(
      `
        id,
        creator_id,
        type,
        url,
        title,
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
    return [];
  }

  const now = Date.now();

  return data.map((row: any) => {
    const interactions = row.content_interactions ?? [];
    const myInteraction = interactions.find((i: any) => i.user_id === userId);
    const savesCount = interactions.filter((i: any) => i.status === "saved").length;
    const doneCount = interactions.filter((i: any) => i.status === "done").length;
    const ratings = interactions
      .map((i: any) => i.rating)
      .filter((r: any): r is number => typeof r === "number");
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((acc: number, r: number) => acc + r, 0) / ratings.length
        : null;

    const ageHours = (now - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
    const baseScore = savesCount * 1 + doneCount * 2 + (avgRating ?? 0) * 1.5;
    const decayFactor = 1 / (1 + ageHours / 24);
    const score = baseScore * decayFactor;

    const comments = interactions
      .filter((i: any) => typeof i.comment === "string" && i.comment.trim().length > 0)
      .map((i: any) => ({
        id: i.id,
        comment: i.comment as string,
        created_at: i.created_at,
        author_id: i.user_id,
        author_name: i.profiles?.display_name ?? null,
        author_avatar_url: i.profiles?.avatar_url ?? null,
      }));

    return {
      id: row.id,
      creator_id: row.creator_id,
      type: row.type,
      url: row.url,
      title: row.title,
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

async function fetchHistory(userId: string) {
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
    return [];
  }

  return data.map((row: any) => ({
    ...row,
    item: Array.isArray(row.item) ? row.item[0] ?? null : row.item,
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
      <h1 className="text-xl font-semibold tracking-tight">
        Shared knowledge
      </h1>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
        <div className="space-y-4">
          <FeedList items={feed} currentUserId={userId} onRefresh={refreshData} />
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
              <CardTitle className="text-sm font-semibold">
                Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <HistoryList history={history} filter="saved" />
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Completed
              </CardTitle>
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

