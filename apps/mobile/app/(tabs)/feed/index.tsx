import { useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import { SkeletonList } from "@/src/components/Skeleton";
import { EmptyState } from "@/src/components/EmptyState";
import type { ContentItem } from "@n3q/shared";
import { formatDistanceToNow, CONTENT_TYPE_LABELS } from "@n3q/shared";

type SortMode = "hot" | "new" | "top";

interface ScoredItem extends ContentItem {
  score: number;
  saves_count: number;
  done_count: number;
  avg_rating: number | null;
}

export default function FeedScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);
  const [sort, setSort] = useState<SortMode>("hot");

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["feed"],
    queryFn: async (): Promise<ScoredItem[]> => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching feed:", error);
        return [];
      }

      const creatorIds = [...new Set((data || []).map((item) => item.creator_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", creatorIds);

      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

      // Fetch all interactions for scoring
      const itemIds = (data || []).map((item) => item.id);
      const { data: interactions } = itemIds.length > 0
        ? await supabase.from("content_interactions").select("*").in("item_id", itemIds)
        : { data: [] };

      const now = Date.now();

      return (data || []).map((item) => {
        const itemInteractions = (interactions || []).filter((i) => i.item_id === item.id);
        const savesCount = itemInteractions.filter((i) => i.status === "saved").length;
        const doneCount = itemInteractions.filter((i) => i.status === "done").length;
        const ratings = itemInteractions.map((i) => i.rating).filter((r): r is number => typeof r === "number");
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

        const ageHours = (now - new Date(item.created_at).getTime()) / (1000 * 60 * 60);
        const baseScore = savesCount * 1 + doneCount * 2 + (avgRating ?? 0) * 1.5;
        const score = baseScore * (1 / (1 + ageHours / 24));

        return {
          ...item,
          creator: profileMap[item.creator_id] || undefined,
          score,
          saves_count: savesCount,
          done_count: doneCount,
          avg_rating: avgRating,
        } as ScoredItem;
      });
    },
    enabled: !!userId,
  });

  const sortedItems = useMemo(() => {
    const sorted = [...items];
    switch (sort) {
      case "hot":
        return sorted.sort((a, b) => b.score - a.score);
      case "new":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "top":
        return sorted.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    }
  }, [items, sort]);

  function renderItem({ item }: { item: ScoredItem }) {
    const typeLabel = CONTENT_TYPE_LABELS[item.type] || item.type;
    const hostname = item.url ? (() => { try { return new URL(item.url).hostname; } catch { return ""; } })() : "";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/feed/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>
            {item.ai_title || item.title}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{typeLabel}</Text>
          </View>
          {hostname ? <Text style={styles.metaText}>{hostname}</Text> : null}
          {item.avg_rating ? <Text style={styles.metaText}>★ {item.avg_rating.toFixed(1)}</Text> : null}
          {(item.saves_count > 0 || item.done_count > 0) && (
            <Text style={styles.metaText}>
              {item.saves_count > 0 ? `${item.saves_count} saved` : ""}
              {item.saves_count > 0 && item.done_count > 0 ? " · " : ""}
              {item.done_count > 0 ? `${item.done_count} done` : ""}
            </Text>
          )}
        </View>

        {item.ai_subtitle && (
          <Text style={styles.description} numberOfLines={2}>
            {item.ai_subtitle}
          </Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {formatDistanceToNow(new Date(item.created_at))}
          </Text>
          {item.creator && (
            <Text style={styles.footerText}>
              by {item.creator.display_name || `${item.creator_id.slice(0, 6)}...`}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      <View style={styles.filterRow}>
        {(["hot", "new", "top"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, sort === f && styles.filterActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSort(f); }}
          >
            <Text style={[styles.filterText, sort === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sortedItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.amber} />
        }
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 12 }]}
        ListHeaderComponent={isLoading && items.length === 0 ? <SkeletonList /> : null}
        ListEmptyComponent={
          !isLoading ? <EmptyState message="No content yet" /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  filterRow: { flexDirection: "row", paddingHorizontal: 14, paddingBottom: 8, gap: 8 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  filterActive: {
    backgroundColor: colors.amberMuted,
    borderColor: colors.amberBorder,
  },
  filterText: { color: colors.mutedForeground, fontSize: 12, fontWeight: "500" },
  filterTextActive: { color: colors.amber },
  list: { paddingHorizontal: 14 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 8,
  },
  cardHeader: { marginBottom: 8 },
  title: { color: colors.foreground, fontSize: 14, fontWeight: "500", lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  badge: { backgroundColor: colors.amberMuted, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.amberBorder },
  badgeText: { color: colors.amber, fontSize: 10, fontWeight: "600" },
  metaText: { color: colors.mutedForeground, fontSize: 11 },
  description: { color: colors.mutedForeground, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  footerText: { color: colors.mutedForeground, fontSize: 11 },
});
