import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { createProject } from "@n3q/shared";
import type { ProjectStatus } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "idea", label: "Idea" },
  { value: "in_progress", label: "In Progress" },
  { value: "looking_for_help", label: "Looking for Help" },
  { value: "completed", label: "Completed" },
];

export default function CreateProjectScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("idea");
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    if (!userId) return;

    setIsSubmitting(true);
    try {
      await createProject(supabase, userId, title.trim(), description.trim() || null, status, isPublic);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="Project name"
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What is this project about?"
          placeholderTextColor="#555"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[styles.statusBtn, status === s.value && styles.statusBtnActive]}
              onPress={() => setStatus(s.value)}
            >
              <Text style={[styles.statusText, status === s.value && styles.statusTextActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Public project</Text>
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
          {isSubmitting ? "Creating..." : "Create Project"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 20 },
  heading: { color: colors.foreground, fontSize: 22, fontWeight: "bold", marginBottom: 24 },
  field: { marginBottom: 20 },
  label: { color: colors.mutedForeground, fontSize: 13, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, padding: 14, color: colors.foreground, fontSize: 15 },
  textArea: { minHeight: 100 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  statusBtnActive: {
    backgroundColor: colors.amberMuted,
    borderColor: colors.amberBorder,
  },
  statusText: { color: colors.mutedForeground, fontSize: 12, fontWeight: "500" },
  statusTextActive: { color: colors.amber },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingVertical: 8 },
  switchLabel: { color: colors.foreground, fontSize: 15 },
  submitButton: { backgroundColor: "#FFA236", padding: 14, alignItems: "center" },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontFamily: "DepartureMono", color: "#171717", fontSize: 16, letterSpacing: 1 },
});
