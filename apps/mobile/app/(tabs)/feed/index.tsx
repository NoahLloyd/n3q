import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import type { ContentItem } from "@n3q/shared";
import { formatDistanceToNow } from "@n3q/shared";

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

      // Fetch creator profiles
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
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/feed/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.type}</Text>
          </View>
          <Text style={styles.timeText}>
            {formatDistanceToNow(new Date(item.created_at))}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.ai_title || item.title}
        </Text>
        {item.ai_subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.ai_subtitle}
          </Text>
        )}
        {item.creator && (
          <Text style={styles.creator}>
            by {item.creator.display_name || "Anonymous"}
          </Text>
        )}
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
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f5a623" />
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
    backgroundColor: "#0a0a0a",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: "#f5a623",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  timeText: {
    color: "#666",
    fontSize: 12,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  subtitle: {
    color: "#999",
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  creator: {
    color: "#666",
    fontSize: 12,
    marginTop: 8,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
});
