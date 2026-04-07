import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchEvent, rsvpEvent, cancelRsvp } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import * as Haptics from "expo-haptics";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const tabBarHeight = 60 + Math.max(insets.bottom - 12, 4);
  const queryClient = useQueryClient();

  const { data: event } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent(supabase, id, userId!),
    enabled: !!userId,
  });

  const rsvpMutation = useMutation({
    mutationFn: () => rsvpEvent(supabase, id, userId!),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: headerHeight + 12, paddingBottom: tabBarHeight + 12 }]}>
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

      <Pressable
        style={[styles.button, event.user_has_rsvp && styles.buttonSecondary]}
        onPress={() => {
          if (event.user_has_rsvp) {
            cancelMutation.mutate();
          } else {
            rsvpMutation.mutate();
          }
        }}
        disabled={rsvpMutation.isPending || cancelMutation.isPending}
      >
        <Text style={[styles.buttonText, event.user_has_rsvp && styles.buttonTextSecondary]}>
          {event.user_has_rsvp ? "Cancel RSVP" : "RSVP"}
        </Text>
      </Pressable>

      {event.rsvps && event.rsvps.length > 0 && (
        <View style={styles.attendees}>
          <Text style={styles.sectionTitle}>
            Attending ({event.rsvp_count})
          </Text>
          {event.rsvps.map((rsvp) => (
            <View key={rsvp.id} style={styles.attendeeRow}>
              <Text style={styles.attendeeName}>
                {rsvp.user?.display_name || "Anonymous"}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 14 },
  loadingText: { color: colors.mutedForeground, textAlign: "center", marginTop: 40 },
  title: { color: colors.foreground, fontSize: 20, fontWeight: "600", marginBottom: 8 },
  date: { color: colors.amber, fontSize: 14 },
  time: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  location: { color: colors.mutedForeground, fontSize: 13, marginTop: 4 },
  description: { color: colors.foreground, fontSize: 14, lineHeight: 21, marginTop: 16 },
  button: {
    backgroundColor: "#FFA236",
    padding: 14,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: { fontFamily: "DepartureMono", fontSize: 16, color: "#171717", letterSpacing: 1 },
  buttonSecondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  buttonTextSecondary: { color: colors.mutedForeground },
  attendees: { marginTop: 24 },
  sectionTitle: { color: colors.mutedForeground, fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  attendeeRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  attendeeName: { color: colors.foreground, fontSize: 14 },
});
