import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { createPoll } from "@n3q/shared";
import type { PollType } from "@n3q/shared";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import { notifyAll } from "@/src/lib/notify";

export default function CreatePollScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pollType, setPollType] = useState<PollType>("yes_no_abstain");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addOption() {
    if (options.length < 10) {
      setOptions([...options, ""]);
    }
  }

  function updateOption(index: number, value: string) {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  }

  function removeOption(index: number) {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    if (!userId) return;

    if (pollType === "multiple_choice") {
      const validOptions = options.filter((o) => o.trim());
      if (validOptions.length < 2) {
        Alert.alert("Error", "At least 2 options are required");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const validOptions = pollType === "multiple_choice"
        ? options.filter((o) => o.trim())
        : undefined;

      await createPoll(supabase, userId, title.trim(), description.trim() || null, pollType, validOptions);

      notifyAll("New Vote", title.trim());
      queryClient.invalidateQueries({ queryKey: ["polls"] });
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to create poll");
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
          placeholder="What do you want to vote on?"
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Add context for voters..."
          placeholderTextColor="#555"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          <Pressable
            style={[styles.typeBtn, pollType === "yes_no_abstain" && styles.typeBtnActive]}
            onPress={() => setPollType("yes_no_abstain")}
          >
            <Text style={[styles.typeText, pollType === "yes_no_abstain" && styles.typeTextActive]}>
              Yes / No / Abstain
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeBtn, pollType === "multiple_choice" && styles.typeBtnActive]}
            onPress={() => setPollType("multiple_choice")}
          >
            <Text style={[styles.typeText, pollType === "multiple_choice" && styles.typeTextActive]}>
              Multiple Choice
            </Text>
          </Pressable>
        </View>
      </View>

      {pollType === "multiple_choice" && (
        <View style={styles.field}>
          <Text style={styles.label}>Options</Text>
          {options.map((option, index) => (
            <View key={index} style={styles.optionRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor="#555"
                value={option}
                onChangeText={(v) => updateOption(index, v)}
              />
              {options.length > 2 && (
                <Pressable style={styles.removeBtn} onPress={() => removeOption(index)}>
                  <Text style={styles.removeBtnText}>x</Text>
                </Pressable>
              )}
            </View>
          ))}
          {options.length < 10 && (
            <Pressable style={styles.addOptionBtn} onPress={addOption}>
              <Text style={styles.addOptionText}>+ Add Option</Text>
            </Pressable>
          )}
        </View>
      )}

      <Pressable
        style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? "Creating..." : "Create Poll"}
        </Text>
      </Pressable>
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
  textArea: { minHeight: 80 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    alignItems: "center",
  },
  typeBtnActive: {
    backgroundColor: colors.amberMuted,
    borderColor: colors.amberBorder,
  },
  typeText: { color: colors.mutedForeground, fontSize: 13, fontWeight: "500" },
  typeTextActive: { color: colors.amber },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  removeBtn: { width: 36, height: 36, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center", justifyContent: "center" },
  removeBtnText: { color: colors.mutedForeground, fontSize: 16 },
  addOptionBtn: { padding: 12, alignItems: "center" },
  addOptionText: { color: colors.amber, fontSize: 14, fontWeight: "500" },
  submitButton: { backgroundColor: "#FFA236", padding: 14, alignItems: "center", marginTop: 8 },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontFamily: "DepartureMono", color: "#171717", fontSize: 16, letterSpacing: 1 },
});
