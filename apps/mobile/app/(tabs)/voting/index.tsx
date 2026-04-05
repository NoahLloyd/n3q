import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchPolls } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import type { Poll } from "@n3q/shared";
import { formatDistanceToNow } from "@n3q/shared";

export default function VotingScreen() {
  const { userId } = useAuth();
  const router = useRouter();

  const { data: polls = [], isLoading, refetch } = useQuery({
    queryKey: ["polls"],
    queryFn: () => fetchPolls(supabase, userId!),
    enabled: !!userId,
  });

  const activePolls = polls.filter((p) => p.status === "active");
  const closedPolls = polls.filter((p) => p.status === "closed").slice(0, 5);

  function renderPoll({ item }: { item: Poll }) {
    const isActive = item.status === "active";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/voting/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, !isActive && styles.closedBadge]}>
            <Text style={[styles.statusText, !isActive && styles.closedText]}>
              {isActive ? "Active" : "Closed"}
            </Text>
          </View>
          {item.user_has_voted && (
            <View style={styles.votedBadge}>
              <Text style={styles.votedText}>Voted</Text>
            </View>
          )}
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.footerText}>
            {item.vote_count || 0} votes &middot;{" "}
            {item.type === "yes_no_abstain" ? "Yes/No/Abstain" : "Multiple Choice"}
          </Text>
          <Text style={styles.timeText}>
            {formatDistanceToNow(new Date(item.created_at))}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[...activePolls, ...closedPolls]}
        renderItem={renderPoll}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f5a623" />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No polls yet</Text>
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
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: "#1a3a1a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  closedBadge: {
    backgroundColor: "#2a2a2a",
  },
  statusText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "600",
  },
  closedText: {
    color: "#888",
  },
  votedBadge: {
    backgroundColor: "#1a2a3a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  votedText: {
    color: "#60a5fa",
    fontSize: 11,
    fontWeight: "600",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  footerText: {
    color: "#666",
    fontSize: 12,
  },
  timeText: {
    color: "#555",
    fontSize: 12,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
});
