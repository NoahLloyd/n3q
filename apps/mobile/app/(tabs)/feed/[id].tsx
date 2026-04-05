import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/src/lib/supabase/client";
import type { ContentItem } from "@n3q/shared";
import { formatDistanceToNow } from "@n3q/shared";

export default function ContentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);

  const { data: item } = useQuery({
    queryKey: ["content", id],
    queryFn: async (): Promise<ContentItem | null> => {
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

      return { ...data, creator: creator || undefined } as ContentItem;
    },
  });

  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight + 12, paddingBottom: tabBarHeight + 12 }]}>
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{item.type}</Text>
      </View>

      <Text style={styles.title}>{item.ai_title || item.title}</Text>

      {item.ai_subtitle && (
        <Text style={styles.subtitle}>{item.ai_subtitle}</Text>
      )}

      <Text style={styles.meta}>
        {item.creator?.display_name || "Anonymous"} &middot;{" "}
        {formatDistanceToNow(new Date(item.created_at))}
      </Text>

      {item.url && (
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => WebBrowser.openBrowserAsync(item.url!)}
        >
          <Text style={styles.linkButtonText}>Open Link</Text>
        </TouchableOpacity>
      )}

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
  typeBadge: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  typeBadgeText: {
    color: "#f5a623",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    lineHeight: 28,
    marginBottom: 8,
  },
  subtitle: {
    color: "#aaa",
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 12,
  },
  meta: {
    color: "#666",
    fontSize: 13,
    marginBottom: 20,
  },
  linkButton: {
    backgroundColor: "#f5a623",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  linkButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionText: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 21,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#333",
  },
  tagText: {
    color: "#aaa",
    fontSize: 12,
  },
});
