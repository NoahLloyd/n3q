import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "@/src/lib/supabase/client";
import { colors } from "@/src/lib/theme";
import type { ContentItem } from "@n3q/shared";
import { formatDistanceToNow, CONTENT_TYPE_LABELS } from "@n3q/shared";

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
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 14 },
  loadingText: { color: colors.mutedForeground, textAlign: "center", marginTop: 40 },
  badge: { backgroundColor: colors.amberMuted, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: colors.amberBorder, alignSelf: "flex-start", marginBottom: 12 },
  badgeText: { color: colors.amber, fontSize: 10, fontWeight: "600" },
  title: { color: colors.foreground, fontSize: 20, fontWeight: "600", lineHeight: 26, marginBottom: 8 },
  subtitle: { color: colors.mutedForeground, fontSize: 14, lineHeight: 21, marginBottom: 12 },
  meta: { color: colors.mutedForeground, fontSize: 12, marginBottom: 20 },
  button: {
    backgroundColor: "#FFA236",
    padding: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonText: { fontFamily: "DepartureMono", fontSize: 16, color: "#171717", letterSpacing: 1 },
  section: { marginBottom: 20 },
  sectionTitle: { color: colors.mutedForeground, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 },
  sectionText: { color: colors.foreground, fontSize: 14, lineHeight: 21 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: colors.card, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.cardBorder },
  tagText: { color: colors.mutedForeground, fontSize: 11 },
});
