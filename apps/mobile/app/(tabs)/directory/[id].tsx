import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase/client";
import { colors } from "@/src/lib/theme";
import type { Profile } from "@n3q/shared";

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);

  const { data: profile } = useQuery({
    queryKey: ["profile", id],
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) return null;
      return data;
    },
  });

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const initials = profile.display_name
    ? profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight + 12, paddingBottom: tabBarHeight + 12 }]}>
      <View style={styles.header}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <Text style={styles.name}>{profile.display_name || "Anonymous"}</Text>
        {profile.email && <Text style={styles.email}>{profile.email}</Text>}
      </View>

      {profile.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.sectionText}>{profile.bio}</Text>
        </View>
      )}

      {profile.wallet_address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <Text style={styles.wallet} numberOfLines={1}>{profile.wallet_address}</Text>
        </View>
      )}

      {profile.created_at && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Member Since</Text>
          <Text style={styles.sectionText}>
            {new Date(profile.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 14 },
  loadingText: { color: colors.mutedForeground, textAlign: "center", marginTop: 40 },
  header: { alignItems: "center", marginBottom: 32, marginTop: 12 },
  avatar: { width: 72, height: 72, marginBottom: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.cardBorder },
  avatarPlaceholder: { backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#f5a623", fontSize: 28, fontWeight: "bold" },
  name: { color: colors.foreground, fontSize: 20, fontWeight: "600" },
  email: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { color: colors.mutedForeground, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  sectionText: { color: colors.foreground, fontSize: 14, lineHeight: 21 },
  wallet: { color: colors.mutedForeground, fontSize: 13, fontFamily: "SpaceMono" },
});
