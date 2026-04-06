import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPoll, castVote } from "@n3q/shared";
import type { YesNoAbstainVote } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import * as Haptics from "expo-haptics";

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
    staleTime: 5 * 60 * 1000,
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
      <View style={[styles.badge, isClosed ? styles.badgeClosed : styles.badgeActive]}>
        <Text style={[styles.badgeText, isClosed ? styles.badgeTextClosed : styles.badgeTextActive]}>
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
              <Pressable
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
                      choice === "yes" && { backgroundColor: colors.amber },
                      choice === "no" && { backgroundColor: colors.red },
                      choice === "abstain" && { backgroundColor: colors.mutedForeground },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.options}>
          {(poll.options || []).map((option) => {
            const pct = totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0;

            return (
              <Pressable
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
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.amber }]} />
                </View>
              </Pressable>
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
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 14 },
  loadingText: { color: colors.mutedForeground, textAlign: "center", marginTop: 40 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, alignSelf: "flex-start", marginBottom: 12 },
  badgeActive: { backgroundColor: colors.amberMuted, borderColor: colors.amberBorder },
  badgeClosed: { backgroundColor: colors.muted, borderColor: colors.cardBorder },
  badgeText: { fontSize: 10, fontWeight: "600" },
  badgeTextActive: { color: colors.amber },
  badgeTextClosed: { color: colors.mutedForeground },
  title: { color: colors.foreground, fontSize: 20, fontWeight: "600", marginBottom: 8 },
  description: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  voteCount: { color: colors.mutedForeground, fontSize: 12, marginBottom: 20 },
  options: { gap: 8 },
  optionCard: {
    backgroundColor: colors.card,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  optionRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  optionLabel: { color: colors.foreground, fontSize: 14, fontWeight: "500" },
  optionCount: { color: colors.mutedForeground, fontSize: 12, fontVariant: ["tabular-nums"] },
  progressBar: { height: 4, backgroundColor: colors.muted, overflow: "hidden" },
  progressFill: { height: "100%" },
  votedNote: { fontFamily: "DepartureMono", color: colors.blue, fontSize: 12, textAlign: "center", marginTop: 16, letterSpacing: 0.5 },
  winnerCard: {
    backgroundColor: colors.card,
    padding: 16,
    marginTop: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  winnerLabel: { fontFamily: "DepartureMono", color: colors.mutedForeground, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  winnerText: { fontFamily: "DepartureMono", color: colors.amber, fontSize: 16, textTransform: "capitalize" },
});
