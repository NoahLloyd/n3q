import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth/context";

export default function LoginScreen() {
  const [link, setLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { authenticate } = useAuth();
  const router = useRouter();

  async function handlePasteLink() {
    if (!link.trim()) {
      Alert.alert("Error", "Please paste your login link");
      return;
    }

    setIsLoading(true);
    try {
      // Extract token from deep link: n3q://auth?token=<TOKEN>
      const url = new URL(link.trim());
      const token = url.searchParams.get("token");

      if (!token) {
        Alert.alert("Error", "Invalid login link");
        return;
      }

      // Exchange token for session
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/auth/mobile-exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert("Error", data.error || "Failed to authenticate");
        return;
      }

      const { access_token, refresh_token } = await response.json();
      await authenticate(access_token, refresh_token);
      router.replace("/(tabs)/feed");
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert("Error", "Failed to authenticate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>N3Q</Text>
        <Text style={styles.subtitle}>Nine Three Quarters</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.instructions}>
          Open N3Q on web, go to your profile, and tap "Link Mobile App" to get a login link.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Paste your login link here..."
          placeholderTextColor="#666"
          value={link}
          onChangeText={setLink}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handlePasteLink}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#f5a623",
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    letterSpacing: 2,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#333",
  },
  instructions: {
    color: "#aaa",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#0a0a0a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 14,
    color: "#fff",
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#f5a623",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
});
