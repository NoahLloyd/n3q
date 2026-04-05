import { View, Text, FlatList, TouchableOpacity, RefreshControl, Image, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { supabase } from "@/src/lib/supabase/client";
import type { Profile } from "@n3q/shared";

export default function DirectoryScreen() {
  const router = useRouter();

  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ["directory"],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_verified", true)
        .order("display_name", { ascending: true });

      if (error) {
        console.error("Error fetching members:", error);
        return [];
      }
      return data || [];
    },
  });

  function renderMember({ item }: { item: Profile }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/directory/${item.id}`)}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {(item.display_name || "?")[0].toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.name} numberOfLines={1}>
          {item.display_name || "Anonymous"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f5a623" />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No members found</Text>
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
  row: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#f5a623",
    fontSize: 22,
    fontWeight: "bold",
  },
  name: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
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
