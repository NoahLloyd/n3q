import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/src/lib/supabase/client";
import { useAuth } from "@/src/lib/auth/context";
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
      <Text style={styles.heading}>Add Content</Text>

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
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => setShowTypePicker(!showTypePicker)}
        >
          <Text style={styles.pickerText}>{CONTENT_TYPE_LABELS[type]}</Text>
        </TouchableOpacity>
        {showTypePicker && (
          <View style={styles.pickerList}>
            {CONTENT_TYPE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pickerOption, t === type && styles.pickerOptionActive]}
                onPress={() => { setType(t); setShowTypePicker(false); }}
              >
                <Text style={[styles.pickerOptionText, t === type && styles.pickerOptionTextActive]}>
                  {CONTENT_TYPE_LABELS[t]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitText}>
          {isSubmitting ? "Adding..." : "Add to Feed"}
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
  pickerButton: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#333", borderRadius: 8, padding: 14 },
  pickerText: { color: "#fff", fontSize: 15 },
  pickerList: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#333", borderRadius: 8, marginTop: 4, maxHeight: 200 },
  pickerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: "#222" },
  pickerOptionActive: { backgroundColor: "#2a2a1a" },
  pickerOptionText: { color: "#ccc", fontSize: 14 },
  pickerOptionTextActive: { color: "#f5a623", fontWeight: "600" },
  submitButton: { backgroundColor: "#f5a623", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 8 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: "#000", fontSize: 16, fontWeight: "600" },
});
