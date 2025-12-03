"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FeedItem } from "@/lib/feed";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  CheckCircle2,
  MessageCircle,
  Send,
  Star,
  Trash2,
  User,
  Tag,
  ExternalLink,
} from "lucide-react";
import { CONTENT_TYPE_OPTIONS } from "@/lib/content-types";

const supabase = createSupabaseBrowserClient();

const FILTER_STORAGE_KEY = "n3q-shared-knowledge-filters";

type StoredFilters = {
  sort?: "hot" | "new" | "top";
  statusFilter?: "all" | "saved" | "done" | "untouched";
  typeFilter?: FeedItem["type"] | "all";
  minRatingFilter?: number;
};

const isValidSort = (value: unknown): value is "hot" | "new" | "top" =>
  value === "hot" || value === "new" || value === "top";

const isValidStatus = (
  value: unknown
): value is "all" | "saved" | "done" | "untouched" =>
  value === "all" ||
  value === "saved" ||
  value === "done" ||
  value === "untouched";

const isValidType = (value: unknown): value is FeedItem["type"] | "all" =>
  value === "all" ||
  (typeof value === "string" &&
    CONTENT_TYPE_OPTIONS.includes(value as FeedItem["type"]));

const readStoredFilters = (): StoredFilters | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(FILTER_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as StoredFilters;
  } catch (error) {
    console.warn("Failed to parse stored knowledge filters", error);
    return null;
  }
};

const safeHostname = (value?: string | null) => {
  if (!value) return "";
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
};

interface FeedListProps {
  items: FeedItem[];
  currentUserId: string;
  onRefresh?: () => void;
}

export function FeedList({ items, currentUserId, onRefresh }: FeedListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sort, setSort] = useState<"hot" | "new" | "top">(() => {
    const stored = readStoredFilters();
    return stored && isValidSort(stored.sort) ? stored.sort : "hot";
  });
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<
    "all" | "saved" | "done" | "untouched"
  >(() => {
    const stored = readStoredFilters();
    return stored && isValidStatus(stored.statusFilter)
      ? stored.statusFilter
      : "all";
  });
  const [typeFilter, setTypeFilter] = useState<FeedItem["type"] | "all">(() => {
    const stored = readStoredFilters();
    return stored && isValidType(stored.typeFilter) ? stored.typeFilter : "all";
  });
  const [minRatingFilter, setMinRatingFilter] = useState<number>(() => {
    const stored = readStoredFilters();
    if (
      stored &&
      typeof stored.minRatingFilter === "number" &&
      !Number.isNaN(stored.minRatingFilter)
    ) {
      return Math.min(5, Math.max(0, stored.minRatingFilter));
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      sort,
      statusFilter,
      typeFilter,
      minRatingFilter,
    };
    window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(payload));
  }, [sort, statusFilter, typeFilter, minRatingFilter]);

  useEffect(() => {
    // Initialize comments open state for new items on the client
    setOpenComments((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (!(item.id in next)) next[item.id] = true;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  }, [items]);

  const handleInteraction = (params: {
    itemId: string;
    status?: "saved" | "done" | null;
    rating?: number | null;
    comment?: string | null;
  }) => {
    startTransition(async () => {
      const { data: existing, error: fetchError } = await supabase
        .from("content_interactions")
        .select("*")
        .eq("user_id", currentUserId)
        .eq("item_id", params.itemId)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error loading existing interaction", fetchError);
        return;
      }

      const payload = {
        user_id: currentUserId,
        item_id: params.itemId,
        status: params.status ?? existing?.status ?? null,
        rating:
          typeof params.rating === "number"
            ? params.rating
            : existing?.rating ?? null,
        comment:
          typeof params.comment === "string"
            ? params.comment.trim().length > 0
              ? params.comment
              : null
            : existing?.comment ?? null,
      };

      const { error } = existing
        ? await supabase
            .from("content_interactions")
            .update(payload)
            .eq("id", existing.id)
        : await supabase.from("content_interactions").insert(payload);

      if (error) {
        console.error("Error updating interaction", error);
        return;
      }

      onRefresh?.() ?? router.refresh();
    });
  };

  const handleDelete = (itemId: string) => {
    startTransition(async () => {
      const confirmed = window.confirm(
        "Remove this item from the feed for everyone?"
      );
      if (!confirmed) return;

      const { error } = await supabase
        .from("content_items")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error("Error deleting item", error);
        return;
      }

      onRefresh?.() ?? router.refresh();
    });
  };

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing here yet. Be the first to add something to the knowledge feed.
      </p>
    );
  }

  const sorted = items.slice().sort((a, b) => {
    if (sort === "new") {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    if (sort === "top") {
      const aScore = (a.avg_rating ?? 0) * 2 + a.done_count + a.saves_count;
      const bScore = (b.avg_rating ?? 0) * 2 + b.done_count + b.saves_count;
      return bScore - aScore;
    }
    // hot (default) uses time-decayed score from the server
    return b.score - a.score;
  });

  const filtered = sorted.filter((item) => {
    if (statusFilter === "saved" && item.my_status !== "saved") return false;
    if (statusFilter === "done" && item.my_status !== "done") return false;
    if (statusFilter === "untouched" && item.my_status !== null) return false;

    if (typeFilter !== "all" && item.type !== typeFilter) return false;

    if (minRatingFilter > 0 && (item.avg_rating ?? 0) < minRatingFilter) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) =>
              setStatusFilter(v as "all" | "saved" | "done" | "untouched")
            }
          >
            <SelectTrigger
              size="sm"
              className="w-[122px] border-border/60 bg-card px-2 text-[11px]"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="saved">Saved</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="untouched">New to me</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => setTypeFilter(v as FeedItem["type"] | "all")}
          >
            <SelectTrigger
              size="sm"
              className="w-[130px] border-border/60 bg-card px-2 text-[11px]"
            >
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any type</SelectItem>
              <SelectItem value="article">Article</SelectItem>
              <SelectItem value="book">Book</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="podcast">Podcast</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex h-8 items-center gap-1 border border-border/60 bg-card px-2">
            <span>Min rating</span>
            <input
              type="number"
              min={0}
              max={5}
              step={0.5}
              value={minRatingFilter}
              onChange={(e) =>
                setMinRatingFilter(
                  Number.isNaN(parseFloat(e.target.value))
                    ? 0
                    : Math.min(5, Math.max(0, parseFloat(e.target.value)))
                )
              }
              className="h-5 w-12 border border-border/60 bg-background px-1 text-[11px] outline-none"
            />
          </div>
        </div>
        <div className="ml-auto inline-flex overflow-hidden border border-border/60 bg-card">
          <button
            type="button"
            onClick={() => setSort("hot")}
            className={cn(
              "flex h-8 items-center px-2",
              sort === "hot" && "bg-muted text-foreground"
            )}
          >
            Hot
          </button>
          <button
            type="button"
            onClick={() => setSort("new")}
            className={cn(
              "flex h-8 items-center border-l border-border/60 px-2",
              sort === "new" && "bg-muted text-foreground"
            )}
          >
            New
          </button>
          <button
            type="button"
            onClick={() => setSort("top")}
            className={cn(
              "flex h-8 items-center border-l border-border/60 px-2",
              sort === "top" && "bg-muted text-foreground"
            )}
          >
            Top
          </button>
        </div>
      </div>
      {filtered.map((item) => {
        const href = item.url ?? undefined;
        const byline =
          item.creator?.display_name ?? item.creator_id.slice(0, 6);
        const typeLabel =
          item.type.charAt(0).toUpperCase() + item.type.slice(1);
        const summaryText = item.summary ?? item.description ?? null;
        const topics =
          item.topics
            ?.map((topic) => topic?.trim())
            .filter((topic): topic is string => Boolean(topic)) ?? [];
        const uniqueTopics = Array.from(new Set(topics)).slice(0, 6);
        const hostname = safeHostname(item.url);

        const displayTitle = item.ai_title ?? item.title;
        const siteLabel = item.site_name ?? hostname ?? "Link";

        return (
          <Card
            key={item.id}
            className="border-border/70 rounded-none overflow-hidden pt-0"
          >
            {item.image_url && (
              <a href={href} target="_blank" rel="noreferrer" className="block">
                <div className="relative w-full bg-muted aspect-3/1">
                  <Image
                    src={item.image_url}
                    alt={displayTitle}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 960px, 100vw"
                    priority={false}
                  />
                </div>
              </a>
            )}
            <CardHeader className="space-y-2 pb-3">
              <CardTitle className="text-base mt-4 mb-0 font-semibold leading-tight">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    {displayTitle}
                  </a>
                ) : (
                  displayTitle
                )}
              </CardTitle>
              {href && (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">{hostname || href}</span>
                </a>
              )}
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {summaryText && (
                <p className="text-sm leading-relaxed text-foreground">
                  {summaryText}
                </p>
              )}
              {uniqueTopics.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {uniqueTopics.map((topic) => (
                    <Badge
                      key={`${item.id}-${topic}`}
                      variant="secondary"
                      className="text-[10px] uppercase tracking-wide"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 border border-border/60 bg-card px-2 py-0.5">
                  {item.creator?.avatar_url ? (
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={item.creator.avatar_url} alt={byline} />
                      <AvatarFallback className="text-[8px]">
                        {(item.creator?.display_name || "M")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  <span>{byline}</span>
                </span>
                <span className="inline-flex items-center gap-1 border border-border/60 bg-card px-2 py-0.5">
                  <Tag className="h-3 w-3" />
                  <span>{typeLabel}</span>
                </span>
                <span className="inline-flex items-center gap-1 border border-border/60 bg-card px-2 py-0.5">
                  <Bookmark className="h-3 w-3" />
                  <span>{item.saves_count} saved</span>
                </span>
                <span className="inline-flex items-center gap-1 border border-border/60 bg-card px-2 py-0.5">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{item.done_count} done</span>
                </span>
                {item.avg_rating && (
                  <span className="inline-flex items-center gap-1 border border-border/60 bg-card px-2 py-0.5">
                    <Star className="h-3 w-3" />
                    <span>{item.avg_rating.toFixed(1)} avg</span>
                  </span>
                )}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 border border-border/60 bg-card px-2 py-0.5"
                  onClick={() =>
                    setOpenComments((prev) => ({
                      ...prev,
                      [item.id]: !prev[item.id],
                    }))
                  }
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>Comments ({item.comments?.length ?? 0})</span>
                </button>
              </div>

              <div className="mt-1 space-y-2 border border-border/60 bg-background/60 pt-2.5 pb-3 px-3">
                <CommentInput
                  initialComment={item.my_comment ?? ""}
                  onSubmit={(comment) =>
                    handleInteraction({
                      itemId: item.id,
                      comment,
                    })
                  }
                  disabled={isPending}
                />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <RatingStars
                      value={item.my_rating ?? null}
                      onChange={(rating) =>
                        handleInteraction({
                          itemId: item.id,
                          rating,
                        })
                      }
                      disabled={isPending}
                    />
                    <Button
                      variant={
                        item.my_status === "saved" ? "default" : "outline"
                      }
                      size="sm"
                      disabled={isPending}
                      className="flex items-center gap-1 px-2 py-1 text-[11px]"
                      onClick={() =>
                        handleInteraction({
                          itemId: item.id,
                          status: "saved",
                        })
                      }
                    >
                      <Bookmark className="h-3 w-3" />
                      <span>Save</span>
                    </Button>
                    <Button
                      variant={
                        item.my_status === "done" ? "default" : "outline"
                      }
                      size="sm"
                      disabled={isPending}
                      className="flex items-center gap-1 px-2 py-1 text-[11px]"
                      onClick={() =>
                        handleInteraction({
                          itemId: item.id,
                          status: "done",
                        })
                      }
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Done</span>
                    </Button>
                    {item.creator_id === currentUserId && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        className="flex items-center gap-1 px-2 py-1 text-[11px]"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Remove</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {openComments[item.id] &&
                item.comments &&
                item.comments.length > 0 && (
                  <div className="mt-2 space-y-2 text-[11px] text-muted-foreground">
                    {item.comments.map((c) => {
                      const initials = (c.author_name || "M")
                        .split(" ")
                        .map((part: string) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <div
                          key={c.id}
                          className="flex gap-2 border border-border/60 bg-background/60 px-3 py-3"
                        >
                          <Avatar className="h-7 w-7">
                            {c.author_avatar_url ? (
                              <AvatarImage
                                src={c.author_avatar_url}
                                alt={c.author_name ?? "Member"}
                              />
                            ) : (
                              <AvatarFallback className="text-[10px]">
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex flex-1 items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {c.author_name ?? "Member"}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(c.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="flex-1 text-xs text-foreground">
                              {c.comment}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RatingStars({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1;
        const active = value !== null && rating <= value;
        return (
          <button
            key={rating}
            type="button"
            className="p-0"
            disabled={disabled}
            onClick={() => onChange(rating)}
          >
            <Star
              className={cn(
                "h-3 w-3",
                active
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function CommentInput({
  initialComment,
  onSubmit,
  disabled,
}: {
  initialComment: string;
  onSubmit: (comment: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState(initialComment ?? "");

  useEffect(() => {
    setValue(initialComment ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  }, [initialComment]);

  const handleSubmit = () => {
    onSubmit(value);
    setValue("");
  };

  return (
    <form
      className="mt-1"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="flex items-stretch border border-border/60 bg-background">
        <textarea
          name="comment"
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Add a comment"
          disabled={disabled}
          className={cn(
            "h-8 w-full resize-none overflow-y-auto border-0 bg-transparent px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          )}
        />
        <Button
          type="submit"
          variant="outline"
          size="icon-sm"
          disabled={disabled}
          className="border-l border-border/60 rounded-none"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </form>
  );
}
