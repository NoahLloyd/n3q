import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchEvents } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import { SkeletonList } from "@/src/components/Skeleton";

import { EmptyState } from "@/src/components/EmptyState";
import { updateWidgetEvents } from "@/src/lib/widget-data";
import type { Event } from "@n3q/shared";

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatEventTime(timeStr: string | null): string | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function EventsScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  const { data: events = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["events", filter],
    queryFn: async () => {
      const data = await fetchEvents(supabase, userId!, filter);
      // Update widget data with upcoming events
      if (filter === "upcoming") {
        updateWidgetEvents(data.map((e) => ({
          id: e.id,
          title: e.title,
          date: e.event_date,
          time: e.event_time?.slice(0, 5) || null,
          location: e.location,
        })));
      }
      return data;
    },
    enabled: !!userId,
  });

  function renderEvent({ item }: { item: Event }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/events/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatEventDate(item.event_date)}</Text>
          {item.event_time && (
            <Text style={styles.metaText}>
              {formatEventTime(item.event_time)}
              {item.event_end_time ? ` - ${formatEventTime(item.event_end_time)}` : ""}
            </Text>
          )}
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description.replace(/[#*`[\]()]/g, "").replace(/\n+/g, " ").slice(0, 100)}
          </Text>
        )}

        {item.location && (
          <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{item.rsvp_count || 0} going</Text>
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
        {(["upcoming", "past"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.amber} />
        }
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 12 }]}
        ListHeaderComponent={isLoading && events.length === 0 ? <SkeletonList /> : null}
        ListEmptyComponent={
          !isLoading ? <EmptyState message={`No ${filter} events`} /> : null
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
  cardHeader: { marginBottom: 6 },
  title: { color: colors.foreground, fontSize: 14, fontWeight: "500", lineHeight: 20 },
  metaRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  metaText: { color: colors.mutedForeground, fontSize: 11 },
  description: { color: colors.mutedForeground, fontSize: 13, lineHeight: 18, marginBottom: 8 },
  location: { color: colors.mutedForeground, fontSize: 11, marginBottom: 8 },
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
