import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import type { ContentItem, ContentInteraction } from "@n3q/shared";
import { formatDistanceToNow, CONTENT_TYPE_LABELS } from "@n3q/shared";

interface FeedDetail extends ContentItem {
  my_status: ContentInteraction["status"];
  my_rating: number | null;
  my_comment: string | null;
  comments: { id: string; comment: string; created_at: string; author_name: string | null }[];
}

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: item } = useQuery({
    queryKey: ["content", id],
    queryFn: async (): Promise<FeedDetail | null> => {
      const { data, error } = await supabase
        .from("content_items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return null;

      const { data: creator } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .eq("id", data.creator_id)
        .maybeSingle();

      // Fetch all interactions for this item
      const { data: interactions } = await supabase
        .from("content_interactions")
        .select("*")
        .eq("item_id", id);

      const myInteraction = (interactions || []).find((i) => i.user_id === userId);

      // Fetch profiles for commenters
      const commentInteractions = (interactions || []).filter((i) => i.comment?.trim());
      const commenterIds = [...new Set(commentInteractions.map((i) => i.user_id))];
      const { data: profiles } = commenterIds.length > 0
        ? await supabase.from("profiles").select("id, display_name").in("id", commenterIds)
        : { data: [] };
      const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.display_name]));

      const comments = commentInteractions.map((i) => ({
        id: i.id,
        comment: i.comment as string,
        created_at: i.created_at,
        author_name: profileMap[i.user_id] || null,
      }));

      const savesCount = (interactions || []).filter((i) => i.status === "saved").length;
      const doneCount = (interactions || []).filter((i) => i.status === "done").length;
      const ratings = (interactions || []).map((i) => i.rating).filter((r): r is number => typeof r === "number");
      const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

      return {
        ...data,
        creator: creator || undefined,
        my_status: myInteraction?.status ?? null,
        my_rating: myInteraction?.rating ?? null,
        my_comment: myInteraction?.comment ?? null,
        saves_count: savesCount,
        done_count: doneCount,
        avg_rating: avgRating,
        comments,
      } as FeedDetail;
    },
    enabled: !!userId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: { status?: ContentInteraction["status"]; rating?: number | null; comment?: string | null }) => {
      const { data: existing } = await supabase
        .from("content_interactions")
        .select("*")
        .eq("user_id", userId!)
        .eq("item_id", id)
        .maybeSingle();

      const payload = {
        user_id: userId!,
        item_id: id,
        status: input.status ?? existing?.status ?? null,
        rating: typeof input.rating === "number" ? input.rating : existing?.rating ?? null,
        comment: typeof input.comment === "string" ? input.comment : existing?.comment ?? null,
      };

      const { error } = existing
        ? await supabase.from("content_interactions").update(payload).eq("id", existing.id)
        : await supabase.from("content_interactions").insert(payload);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      queryClient.invalidateQueries({ queryKey: ["content", id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: headerHeight + 12, paddingBottom: tabBarHeight + 12 }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{CONTENT_TYPE_LABELS[item.type] || item.type}</Text>
        </View>

        <Text style={styles.title}>{item.ai_title || item.title}</Text>

        {item.ai_subtitle && (
          <Text style={styles.subtitle}>{item.ai_subtitle}</Text>
        )}

        <Text style={styles.meta}>
          {item.creator?.display_name || "Anonymous"} · {formatDistanceToNow(new Date(item.created_at))}
        </Text>

        {item.url && (
          <Pressable
            style={styles.button}
            onPress={() => WebBrowser.openBrowserAsync(item.url!)}
          >
            <Text style={styles.buttonText}>Open Link</Text>
          </Pressable>
        )}

        {/* Status buttons */}
        <View style={styles.statusRow}>
          <Pressable
            style={[styles.statusBtn, item.my_status === "saved" && styles.statusBtnActive]}
            onPress={() => upsertMutation.mutate({ status: item.my_status === "saved" ? null : "saved" })}
          >
            <Text style={[styles.statusBtnText, item.my_status === "saved" && styles.statusBtnTextActive]}>
              Save{item.saves_count ? ` (${item.saves_count})` : ""}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.statusBtn, item.my_status === "done" && styles.statusBtnActive]}
            onPress={() => upsertMutation.mutate({ status: item.my_status === "done" ? null : "done" })}
          >
            <Text style={[styles.statusBtnText, item.my_status === "done" && styles.statusBtnTextActive]}>
              Done{item.done_count ? ` (${item.done_count})` : ""}
            </Text>
          </Pressable>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Rate{item.avg_rating ? ` · avg ${item.avg_rating.toFixed(1)}` : ""}
          </Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => upsertMutation.mutate({ rating: item.my_rating === star ? null : star })}
                style={styles.starBtn}
              >
                <Text style={[styles.starText, star <= (item.my_rating || 0) && styles.starActive]}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {item.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.sectionText}>{item.summary}</Text>
          </View>
        )}

        {item.topics && item.topics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topics</Text>
            <View style={styles.tags}>
              {item.topics.map((topic, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comments ({(item.comments || []).length})</Text>

          <View style={styles.commentInput}>
            <TextInput
              style={styles.commentField}
              placeholder="Add a comment..."
              placeholderTextColor="#555"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            {commentText.trim() && (
              <Pressable
                style={styles.commentSend}
                onPress={() => {
                  upsertMutation.mutate({ comment: commentText.trim() });
                  setCommentText("");
                }}
              >
                <Text style={styles.commentSendText}>Post</Text>
              </Pressable>
            )}
          </View>

          {(item.comments || []).map((c) => (
            <View key={c.id} style={styles.commentCard}>
              <Text style={styles.commentAuthor}>{c.author_name || "Anonymous"}</Text>
              <Text style={styles.commentBody}>{c.comment}</Text>
              <Text style={styles.commentTime}>{formatDistanceToNow(new Date(c.created_at))}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 14 },
  loadingText: { color: colors.mutedForeground, textAlign: "center", marginTop: 40 },
  badge: { backgroundColor: colors.amberMuted, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.amberBorder, alignSelf: "flex-start", marginBottom: 12 },
  badgeText: { color: colors.amber, fontSize: 10, fontWeight: "600" },
  title: { color: colors.foreground, fontSize: 20, fontWeight: "600", lineHeight: 26, marginBottom: 8 },
  subtitle: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  meta: { color: colors.mutedForeground, fontSize: 12, marginBottom: 20 },
  button: { backgroundColor: "#FFA236", padding: 14, alignItems: "center", marginBottom: 16 },
  buttonText: { fontFamily: "DepartureMono", fontSize: 16, color: "#171717", letterSpacing: 1 },

  statusRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statusBtn: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statusBtnActive: {
    backgroundColor: colors.amberMuted,
    borderColor: colors.amberBorder,
  },
  statusBtnText: { fontFamily: "DepartureMono", fontSize: 12, color: colors.mutedForeground, letterSpacing: 0.5 },
  statusBtnTextActive: { color: colors.amber },

  ratingRow: { flexDirection: "row", gap: 4 },
  starBtn: { padding: 4 },
  starText: { fontSize: 24, color: colors.muted },
  starActive: { color: colors.amber },

  section: { marginBottom: 20 },
  sectionTitle: { color: colors.mutedForeground, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  sectionText: { color: colors.foreground, fontSize: 14, lineHeight: 21 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.cardBorder },
  tagText: { color: colors.mutedForeground, fontSize: 11 },

  commentInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 12,
  },
  commentField: { color: colors.foreground, fontSize: 14, minHeight: 40, textAlignVertical: "top" },
  commentSend: { alignSelf: "flex-end", marginTop: 8 },
  commentSendText: { fontFamily: "DepartureMono", fontSize: 13, color: colors.amber },

  commentCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 8,
  },
  commentAuthor: { color: colors.foreground, fontSize: 13, fontWeight: "500", marginBottom: 4 },
  commentBody: { color: colors.foreground, fontSize: 14, lineHeight: 20, marginBottom: 6 },
  commentTime: { color: colors.mutedForeground, fontSize: 11 },
});
