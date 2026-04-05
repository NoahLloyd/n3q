import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from "react-native";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { fetchEvents } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import type { Event } from "@n3q/shared";

export default function EventsScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["events", filter],
    queryFn: () => fetchEvents(supabase, userId!, filter),
    enabled: !!userId,
  });

  function renderEvent({ item }: { item: Event }) {
    const dateStr = new Date(item.event_date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/events/${item.id}`)}
      >
        <View style={styles.dateColumn}>
          <Text style={styles.dateDay}>
            {new Date(item.event_date).getDate()}
          </Text>
          <Text style={styles.dateMonth}>
            {new Date(item.event_date).toLocaleDateString("en-US", { month: "short" })}
          </Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {item.location && (
            <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
          )}
          <Text style={styles.rsvpCount}>
            {item.rsvp_count || 0} attending
          </Text>
        </View>
        {item.user_has_rsvp && (
          <View style={styles.goingBadge}>
            <Text style={styles.goingText}>Going</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filter === "upcoming" && styles.filterActive]}
          onPress={() => setFilter("upcoming")}
        >
          <Text style={[styles.filterText, filter === "upcoming" && styles.filterTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filter === "past" && styles.filterActive]}
          onPress={() => setFilter("past")}
        >
          <Text style={[styles.filterText, filter === "past" && styles.filterTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#f5a623" />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No {filter} events</Text>
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
  filterRow: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#222",
  },
  filterActive: {
    backgroundColor: "#f5a623",
    borderColor: "#f5a623",
  },
  filterText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#000",
  },
  list: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  dateColumn: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 40,
  },
  dateDay: {
    color: "#f5a623",
    fontSize: 22,
    fontWeight: "bold",
  },
  dateMonth: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
  },
  details: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  location: {
    color: "#888",
    fontSize: 13,
    marginTop: 2,
  },
  rsvpCount: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  goingBadge: {
    backgroundColor: "#1a3a1a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  goingText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "600",
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
