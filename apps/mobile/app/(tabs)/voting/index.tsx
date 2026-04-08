import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchPolls } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import { SkeletonList } from "@/src/components/Skeleton";

import { EmptyState } from "@/src/components/EmptyState";
import type { Poll } from "@n3q/shared";
import { formatDistanceToNow } from "@n3q/shared";

function getResultsBars(poll: Poll) {
  if (poll.type === "yes_no_abstain") {
    const total = poll.yes_count + poll.no_count + poll.abstain_count;
    return {
      total,
      bars: [
        { label: "Yes", count: poll.yes_count, color: colors.amber },
        { label: "No", count: poll.no_count, color: colors.red },
        { label: "Abstain", count: poll.abstain_count, color: colors.mutedForeground },
      ],
    };
  } else {
    const options = poll.options || [];
    const total = options.reduce((sum, opt) => sum + opt.vote_count, 0);
    const barColors = [colors.amber, colors.blue, colors.green, "#a78bfa", "#f472b6"];
    return {
      total,
      bars: options
        .sort((a, b) => a.position - b.position)
        .map((opt, i) => ({
          label: opt.label,
          count: opt.vote_count,
          color: barColors[i % barColors.length],
        })),
    };
  }
}

export default function VotingScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);
  const [filter, setFilter] = useState<"active" | "closed">("active");

  const { data: polls = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["polls"],
    queryFn: () => fetchPolls(supabase, userId!),
    enabled: !!userId,
  });

  const filteredPolls = polls.filter((p) => p.status === filter);

  function renderPoll({ item }: { item: Poll }) {
    const isClosed = item.status === "closed";
    const results = getResultsBars(item);
    const voteCount = item.vote_count || results.total;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/voting/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.badge, isClosed ? styles.badgeClosed : styles.badgeActive]}>
            <Text style={[styles.badgeText, isClosed ? styles.badgeTextClosed : styles.badgeTextActive]}>
              {isClosed ? "Closed" : "Active"}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {item.type === "yes_no_abstain" ? "Yes/No/Abstain" : "Multiple Choice"}
          </Text>
          <Text style={styles.metaText}>{voteCount} votes</Text>
        </View>

        {/* Result bars */}
        <View style={styles.barsContainer}>
          {results.bars.slice(0, 3).map((bar) => {
            const pct = results.total > 0 ? (bar.count / results.total) * 100 : 0;
            return (
              <View key={bar.label} style={styles.barRow}>
                <View style={styles.barLabel}>
                  <Text style={styles.barLabelText} numberOfLines={1}>{bar.label}</Text>
                  <Text style={styles.barCount}>{bar.count}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: bar.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isClosed && item.closed_at
              ? `Closed ${formatDistanceToNow(new Date(item.closed_at))}`
              : formatDistanceToNow(new Date(item.created_at))}
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
        {(["active", "closed"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "active" ? "Active" : "Past"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredPolls}
        renderItem={renderPoll}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.amber} />
        }
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 12 }]}
        ListHeaderComponent={isLoading && filteredPolls.length === 0 ? <SkeletonList /> : null}
        ListEmptyComponent={
          !isLoading ? <EmptyState message={filter === "active" ? "No active polls" : "No past polls"} /> : null
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 6,
  },
  title: { color: colors.foreground, fontSize: 14, fontWeight: "500", lineHeight: 20, flex: 1 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  badgeActive: { backgroundColor: colors.amberMuted, borderColor: colors.amberBorder },
  badgeClosed: { backgroundColor: colors.muted, borderColor: colors.cardBorder },
  badgeText: { fontSize: 10, fontWeight: "600" },
  badgeTextActive: { color: colors.amber },
  badgeTextClosed: { color: colors.mutedForeground },
  metaRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  metaText: { color: colors.mutedForeground, fontSize: 11 },
  barsContainer: { gap: 6, marginBottom: 10 },
  barRow: { gap: 4 },
  barLabel: { flexDirection: "row", justifyContent: "space-between" },
  barLabelText: { color: colors.mutedForeground, fontSize: 11, flex: 1 },
  barCount: { color: colors.foreground, fontSize: 11, fontWeight: "500", fontVariant: ["tabular-nums"] },
  barTrack: { height: 4, backgroundColor: colors.muted, overflow: "hidden" },
  barFill: { height: "100%" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  footerText: { color: colors.mutedForeground, fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: colors.mutedForeground, fontSize: 14 },
});
