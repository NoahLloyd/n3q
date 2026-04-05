import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import type { ContentItem } from "@n3q/shared";
import { formatDistanceToNow, CONTENT_TYPE_LABELS } from "@n3q/shared";

export default function FeedScreen() {
  const { userId } = useAuth();
  const router = useRouter();

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["feed"],
    queryFn: async (): Promise<ContentItem[]> => {
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

      return (data || []).map((item) => ({
        ...item,
        creator: profileMap[item.creator_id] || undefined,
      })) as ContentItem[];
    },
    enabled: !!userId,
  });

  function renderItem({ item }: { item: ContentItem }) {
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
          {hostname ? (
            <Text style={styles.metaText}>{hostname}</Text>
          ) : null}
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
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.amber} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No content yet</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 8,
  },
  cardHeader: {
    marginBottom: 8,
  },
  title: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    backgroundColor: colors.amberMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  badgeText: {
    color: colors.amber,
    fontSize: 10,
    fontWeight: "600",
  },
  metaText: {
    color: colors.mutedForeground,
    fontSize: 11,
  },
  description: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  footerText: {
    color: colors.mutedForeground,
    fontSize: 11,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
});
