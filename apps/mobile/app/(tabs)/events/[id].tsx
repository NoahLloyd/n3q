import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEvent, rsvpEvent, cancelRsvp } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent(supabase, id, userId!),
    enabled: !!userId,
  });

  const rsvpMutation = useMutation({
    mutationFn: () => rsvpEvent(supabase, id, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelRsvp(supabase, id, userId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: Error) => Alert.alert("Error", err.message),
  });

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const dateStr = new Date(event.event_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.date}>{dateStr}</Text>
      {event.event_time && (
        <Text style={styles.time}>
          {event.event_time.slice(0, 5)}
          {event.event_end_time ? ` - ${event.event_end_time.slice(0, 5)}` : ""}
        </Text>
      )}
      {event.location && <Text style={styles.location}>{event.location}</Text>}

      {event.description && (
        <Text style={styles.description}>{event.description}</Text>
      )}

      <TouchableOpacity
        style={[styles.rsvpButton, event.user_has_rsvp && styles.cancelButton]}
        onPress={() => {
          if (event.user_has_rsvp) {
            cancelMutation.mutate();
          } else {
            rsvpMutation.mutate();
          }
        }}
        disabled={rsvpMutation.isPending || cancelMutation.isPending}
      >
        <Text style={[styles.rsvpText, event.user_has_rsvp && styles.cancelText]}>
          {event.user_has_rsvp ? "Cancel RSVP" : "RSVP"}
        </Text>
      </TouchableOpacity>

      {event.rsvps && event.rsvps.length > 0 && (
        <View style={styles.attendees}>
          <Text style={styles.sectionTitle}>
            Attending ({event.rsvp_count})
          </Text>
          {event.rsvps.map((rsvp) => (
            <Text key={rsvp.id} style={styles.attendeeName}>
              {rsvp.user?.display_name || "Anonymous"}
            </Text>
          ))}
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
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  date: {
    color: "#f5a623",
    fontSize: 15,
    fontWeight: "500",
  },
  time: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 4,
  },
  location: {
    color: "#888",
    fontSize: 14,
    marginTop: 4,
  },
  description: {
    color: "#ccc",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
  },
  rsvpButton: {
    backgroundColor: "#f5a623",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "#444",
  },
  rsvpText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelText: {
    color: "#ccc",
  },
  attendees: {
    marginTop: 24,
  },
  sectionTitle: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  attendeeName: {
    color: "#ccc",
    fontSize: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
});
