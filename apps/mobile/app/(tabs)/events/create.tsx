import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { createEvent } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";

export default function CreateEventScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    if (!date.trim()) {
      Alert.alert("Error", "Date is required (YYYY-MM-DD)");
      return;
    }
    if (!userId) return;

    setIsSubmitting(true);
    try {
      await createEvent(
        supabase,
        userId,
        title.trim(),
        date.trim(),
        description.trim() || null,
        location.trim() || null,
        time.trim() || null,
        isPublic,
        endTime.trim() || null
      );

      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Create Event</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Event name"
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Date * (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="2026-04-15"
          placeholderTextColor="#555"
          value={date}
          onChangeText={setDate}
          keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "default"}
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Start Time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            placeholder="18:00"
            placeholderTextColor="#555"
            value={time}
            onChangeText={setTime}
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>End Time (HH:MM)</Text>
          <TextInput
            style={styles.input}
            placeholder="20:00"
            placeholderTextColor="#555"
            value={endTime}
            onChangeText={setEndTime}
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Where is it?"
          placeholderTextColor="#555"
          value={location}
          onChangeText={setLocation}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell people about this event..."
          placeholderTextColor="#555"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Public event</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
          trackColor={{ false: "#333", true: "#f5a623" }}
          thumbColor="#fff"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? "Creating..." : "Create Event"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  content: { padding: 20 },
  heading: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { color: "#aaa", fontSize: 13, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#333", borderRadius: 8, padding: 14, color: "#fff", fontSize: 15 },
  textArea: { minHeight: 100 },
  row: { flexDirection: "row" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingVertical: 8 },
  switchLabel: { color: "#ccc", fontSize: 15 },
  submitButton: { backgroundColor: "#f5a623", borderRadius: 8, padding: 14, alignItems: "center" },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
