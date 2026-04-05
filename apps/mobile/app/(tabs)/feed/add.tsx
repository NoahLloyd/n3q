import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from "react-native";

import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";
import { CONTENT_TYPE_OPTIONS, CONTENT_TYPE_LABELS } from "@n3q/shared";
import type { ContentType } from "@n3q/shared";

export default function AddContentScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("article");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }
    if (!userId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("content_items").insert({
        creator_id: userId,
        type,
        url: url.trim() || null,
        title: title.trim(),
      });

      if (error) throw new Error(error.message);

      queryClient.invalidateQueries({ queryKey: ["feed"] });
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to add content");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor="#555"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="What is this about?"
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Type</Text>
        <Pressable
          style={styles.pickerButton}
          onPress={() => setShowTypePicker(!showTypePicker)}
        >
          <Text style={styles.pickerText}>{CONTENT_TYPE_LABELS[type]}</Text>
        </Pressable>
        {showTypePicker && (
          <View style={styles.pickerList}>
            {CONTENT_TYPE_OPTIONS.map((t) => (
              <Pressable
                key={t}
                style={[styles.pickerOption, t === type && styles.pickerOptionActive]}
                onPress={() => { setType(t); setShowTypePicker(false); }}
              >
                <Text style={[styles.pickerOptionText, t === type && styles.pickerOptionTextActive]}>
                  {CONTENT_TYPE_LABELS[t]}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Pressable
        style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? "Adding..." : "Add to Knowledge"}
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
  pickerButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, padding: 14 },
  pickerText: { color: colors.foreground, fontSize: 15 },
  pickerList: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, marginTop: 4 },
  pickerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  pickerOptionActive: { backgroundColor: colors.amberMuted },
  pickerOptionText: { color: colors.mutedForeground, fontSize: 14 },
  pickerOptionTextActive: { color: colors.amber, fontWeight: "600" },
  submitButton: { backgroundColor: "#FFA236", padding: 14, alignItems: "center", marginTop: 8 },
  submitDisabled: { opacity: 0.6 },
  submitText: { fontFamily: "DepartureMono", color: "#171717", fontSize: 16, letterSpacing: 1 },
});
