import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { colors } from "@/src/lib/theme";
import { SkeletonMemberList } from "@/src/components/Skeleton";

import { EmptyState } from "@/src/components/EmptyState";
import type { Profile } from "@n3q/shared";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function DirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);

  const { data: members = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["directory"],
    queryFn: async (): Promise<Profile[]> => {
      const res = await fetch(`${API_URL}/api/members/list`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.members || [];
    },
  });

  function renderMember({ item }: { item: Profile }) {
    const initials = item.display_name
      ? item.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
      : "?";

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/directory/${item.id}`)}
        activeOpacity={0.7}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.memberInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {item.display_name || "Anonymous"}
          </Text>
          {item.bio && (
            <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.amber} />
        }
        contentContainerStyle={[styles.list, { paddingTop: headerHeight + 12, paddingBottom: tabBarHeight + 12 }]}
        ListHeaderComponent={isLoading && members.length === 0 ? <SkeletonMemberList /> : null}
        ListEmptyComponent={
          !isLoading ? <EmptyState message="No members found" /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  list: { padding: 14 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 0,
  },
  avatarPlaceholder: {
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.amber,
    fontSize: 14,
    fontWeight: "600",
  },
  memberInfo: {
    flex: 1,
  },
  name: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "500",
  },
  bio: {
    color: colors.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: colors.mutedForeground, fontSize: 14 },
});
