import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { fetchPoll, castVote } from "@n3q/shared";
import type { YesNoAbstainVote } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function PollDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);
  const queryClient = useQueryClient();

  const { data: poll } = useQuery({
    queryKey: ["poll", id],
    queryFn: () => fetchPoll(supabase, id, userId!),
    enabled: !!userId,
  });

  const { data: memberCount = 50 } = useQuery({
    queryKey: ["memberCount"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/members/count`);
      if (!res.ok) return 50;
      const data = await res.json();
      return data.count;
    },
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });

  const voteMutation = useMutation({
    mutationFn: async ({ vote, optionId }: { vote?: YesNoAbstainVote; optionId?: string }) => {
      return castVote(supabase, id, userId!, vote || null, optionId || null, memberCount);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["poll", id] });
      queryClient.invalidateQueries({ queryKey: ["polls"] });
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  if (!poll) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isClosed = poll.status === "closed";
  const totalVotes = poll.type === "yes_no_abstain"
    ? poll.yes_count + poll.no_count + poll.abstain_count
    : (poll.options || []).reduce((sum, o) => sum + o.vote_count, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight + 12, paddingBottom: tabBarHeight + 12 }]}>
      <View style={[styles.statusBadge, isClosed && styles.closedBadge]}>
        <Text style={[styles.statusText, isClosed && styles.closedText]}>
          {isClosed ? "Closed" : "Active"}
        </Text>
      </View>

      <Text style={styles.title}>{poll.title}</Text>
      {poll.description && (
        <Text style={styles.description}>{poll.description}</Text>
      )}

      <Text style={styles.voteCount}>{totalVotes} total votes</Text>

      {poll.type === "yes_no_abstain" ? (
        <View style={styles.options}>
          {(["yes", "no", "abstain"] as const).map((choice) => {
            const count = poll[`${choice}_count`];
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

            return (
              <TouchableOpacity
                key={choice}
                style={styles.optionCard}
                onPress={() => voteMutation.mutate({ vote: choice })}
                disabled={poll.user_has_voted || isClosed || voteMutation.isPending}
              >
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>
                    {choice.charAt(0).toUpperCase() + choice.slice(1)}
                  </Text>
                  <Text style={styles.optionCount}>{count} ({pct}%)</Text>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${pct}%` },
                      choice === "yes" && styles.fillYes,
                      choice === "no" && styles.fillNo,
                      choice === "abstain" && styles.fillAbstain,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.options}>
          {(poll.options || []).map((option) => {
            const pct = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;

            return (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => voteMutation.mutate({ optionId: option.id })}
                disabled={poll.user_has_voted || isClosed || voteMutation.isPending}
              >
                <View style={styles.optionRow}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionCount}>{option.vote_count} ({pct}%)</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, styles.fillYes, { width: `${pct}%` }]} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {poll.user_has_voted && (
        <Text style={styles.votedNote}>You have already voted</Text>
      )}

      {isClosed && poll.winning_option && (
        <View style={styles.winnerCard}>
          <Text style={styles.winnerLabel}>Result</Text>
          <Text style={styles.winnerText}>{poll.winning_option}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  content: {
    padding: 20,
  },
  loadingText: {
    color: "#666",
    textAlign: "center",
    marginTop: 40,
  },
  statusBadge: {
    backgroundColor: "#1a3a1a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  closedBadge: {
    backgroundColor: "#2a2a2a",
  },
  statusText: {
    color: "#4ade80",
    fontSize: 12,
    fontWeight: "600",
  },
  closedText: {
    color: "#888",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  voteCount: {
    color: "#666",
    fontSize: 13,
    marginBottom: 20,
  },
  options: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#222",
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  optionLabel: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  optionCount: {
    color: "#888",
    fontSize: 13,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#2a2a2a",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  fillYes: {
    backgroundColor: "#4ade80",
  },
  fillNo: {
    backgroundColor: "#f87171",
  },
  fillAbstain: {
    backgroundColor: "#888",
  },
  votedNote: {
    color: "#60a5fa",
    fontSize: 13,
    textAlign: "center",
    marginTop: 16,
  },
  winnerCard: {
    backgroundColor: "#1a2a1a",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a3a2a",
  },
  winnerLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  winnerText: {
    color: "#4ade80",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "capitalize",
  },
});
