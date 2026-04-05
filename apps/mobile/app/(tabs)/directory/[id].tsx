import { View, Text, ScrollView, Image, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase/client";
import type { Profile } from "@n3q/shared";

export default function MemberProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {(profile.display_name || "?")[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{profile.display_name || "Anonymous"}</Text>
      </View>

      {profile.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bio</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>
      )}

      {profile.wallet_address && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          <Text style={styles.wallet} numberOfLines={1}>
            {profile.wallet_address}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Member since</Text>
        <Text style={styles.info}>
          {new Date(profile.created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>
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
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#f5a623",
    fontSize: 36,
    fontWeight: "bold",
  },
  name: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  bio: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 21,
  },
  wallet: {
    color: "#aaa",
    fontSize: 13,
    fontFamily: "SpaceMono",
  },
  info: {
    color: "#aaa",
    fontSize: 14,
  },
});
