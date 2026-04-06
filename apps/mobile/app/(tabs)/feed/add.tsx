import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, Keyboard } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/src/lib/auth/context";
import { colors } from "@/src/lib/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function AddContentScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = url.trim();
    if (!trimmed) {
      Alert.alert("Error", "Paste a link to share");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      Alert.alert("Error", "That doesn't look like a valid URL");
      return;
    }

    if (!userId) return;

    Keyboard.dismiss();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/content/enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, userId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add content");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      router.back();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to add content");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="https://..."
          placeholderTextColor="#555"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          keyboardType="url"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />

        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#171717" />
              <Text style={styles.submitText}>Enriching...</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>Add to Knowledge</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: 20, paddingTop: 200 },
  hint: {
    fontFamily: "DepartureMono",
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    color: colors.foreground,
    fontSize: 15,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: "#FFA236",
    padding: 14,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.6 },
  submitText: {
    fontFamily: "DepartureMono",
    color: "#171717",
    fontSize: 16,
    letterSpacing: 1,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
