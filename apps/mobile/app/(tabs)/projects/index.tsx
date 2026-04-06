import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchProjects } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import { SkeletonList } from "@/src/components/Skeleton";
import { EmptyState } from "@/src/components/EmptyState";
import type { Project, ProjectStatus } from "@n3q/shared";
import { formatDistanceToNow } from "@n3q/shared";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  idea: "Idea",
  in_progress: "In Progress",
  looking_for_help: "Looking for Help",
  completed: "Completed",
};

const STATUS_COLORS: Record<ProjectStatus, { bg: string; border: string; text: string }> = {
  idea: { bg: colors.amberMuted, border: colors.amberBorder, text: colors.amber },
  in_progress: { bg: "rgba(96,165,250,0.2)", border: "rgba(96,165,250,0.3)", text: colors.blue },
  looking_for_help: { bg: colors.amberMuted, border: colors.amberBorder, text: colors.amber },
  completed: { bg: colors.muted, border: colors.cardBorder, text: colors.mutedForeground },
};

export default function ProjectsScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ["projects", filter],
    queryFn: () => fetchProjects(supabase, userId!, filter === "all" ? undefined : filter),
    enabled: !!userId,
  });

  function renderProject({ item }: { item: Project }) {
    const statusColor = STATUS_COLORS[item.status];
    const descriptionPreview = item.description
      ? item.description.replace(/[#*`[\]()]/g, "").replace(/\n+/g, " ").slice(0, 120).trim() + (item.description.length > 120 ? "..." : "")
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/projects/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.badge, { backgroundColor: statusColor.bg, borderColor: statusColor.border }]}>
            <Text style={[styles.badgeText, { color: statusColor.text }]}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </View>

        {descriptionPreview && (
          <Text style={styles.description} numberOfLines={3}>{descriptionPreview}</Text>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>{item.member_count || 0} member{(item.member_count || 0) !== 1 ? "s" : ""}</Text>
          <Text style={styles.footerText}>
            {formatDistanceToNow(new Date(item.created_at))}
            {item.creator && ` by ${item.creator.display_name || `${item.creator_id.slice(0, 6)}...`}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: headerHeight }]}>
      <View style={styles.filterRow}>
        {(["all", "idea", "in_progress", "looking_for_help", "completed"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? "All" : STATUS_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.amber} />
        }
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 12 }]}
        ListHeaderComponent={isLoading && projects.length === 0 ? <SkeletonList /> : null}
        ListEmptyComponent={
          !isLoading ? <EmptyState message="No projects yet" /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  filterRow: { flexDirection: "row", paddingHorizontal: 14, paddingBottom: 8, gap: 8, flexWrap: "wrap" },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  filterActive: {
    backgroundColor: colors.amberMuted,
    borderColor: colors.amberBorder,
  },
  filterText: { color: colors.mutedForeground, fontSize: 11, fontWeight: "500" },
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
  badgeText: { fontSize: 9, fontWeight: "600" },
  description: { color: colors.mutedForeground, fontSize: 13, lineHeight: 18, marginBottom: 8 },
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
