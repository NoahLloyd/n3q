import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from "react-native-svg";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth/context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function BackgroundGlow() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="38%" rx="60%" ry="30%">
            <Stop offset="0%" stopColor="#f5a623" stopOpacity="0.06" />
            <Stop offset="50%" stopColor="#f5a623" stopOpacity="0.02" />
            <Stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#bg)" />
      </Svg>
    </View>
  );
}

function LogoWithGlow() {
  const glowSize = 180;
  const logoSize = 64;
  const glowOffset = (logoSize - glowSize) / 2;
  return (
    <View style={{ width: logoSize, height: logoSize }}>
      <View style={{ position: "absolute", width: glowSize, height: glowSize, top: glowOffset, left: glowOffset }} pointerEvents="none">
        <Svg width={glowSize} height={glowSize}>
          <Defs>
            <RadialGradient id="logo" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#f5a623" stopOpacity="0.1" />
              <Stop offset="40%" stopColor="#f5a623" stopOpacity="0.03" />
              <Stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={glowSize / 2} cy={glowSize / 2} r={glowSize / 2} fill="url(#logo)" />
        </Svg>
      </View>
      <Image
        source={require("../assets/images/n3q-favicon.png")}
        style={{ width: logoSize, height: logoSize }}
      />
    </View>
  );
}

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
      const url = new URL(link.trim());
      const token = url.searchParams.get("token");

      if (!token) {
        Alert.alert("Error", "Invalid login link");
        return;
      }

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
      <BackgroundGlow />

      {/* Glass card */}
      <View style={styles.card}>
        {/* Top highlight line */}
        <View style={styles.topHighlight} />

        {/* Logo */}
        <View style={styles.logoContainer}>
          <LogoWithGlow />
        </View>

        {/* Wordmark */}
        <View style={styles.wordmarkContainer}>
          <Image
            source={require("../assets/images/Logo-text.png")}
            style={styles.wordmark}
            resizeMode="contain"
          />
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>a free lab for builders</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Instructions */}
        <Text style={styles.instructions}>
          Open N3Q on web, go to your profile, and tap "Link Mobile App" to get a login link.
        </Text>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <TextInput
            style={styles.input}
            placeholder="PASTE LOGIN LINK"
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={link}
            onChangeText={setLink}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Sign In button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handlePasteLink}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <View style={[styles.cornerAmber, styles.cornerTL]} />
          <View style={[styles.cornerAmber, styles.cornerTR]} />
          <View style={[styles.cornerAmber, styles.cornerBL]} />
          <View style={[styles.cornerAmber, styles.cornerBR]} />
          {isLoading ? (
            <ActivityIndicator color="rgba(245,166,35,0.9)" />
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
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  wordmarkContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  wordmark: {
    width: SCREEN_WIDTH * 0.55,
    maxWidth: 220,
    height: 30,
    opacity: 0.9,
  },
  tagline: {
    fontFamily: "DepartureMono",
    fontSize: 11,
    color: "#7A7B70",
    textAlign: "center",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 24,
  },
  instructions: {
    fontFamily: "DepartureMono",
    fontSize: 11,
    color: "#6A6B60",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 16,
  },
  input: {
    fontFamily: "DepartureMono",
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    letterSpacing: 1,
  },
  button: {
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.25)",
    backgroundColor: "rgba(245,166,35,0.03)",
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "DepartureMono",
    fontSize: 12,
    color: "rgba(245,166,35,0.9)",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  corner: {
    position: "absolute",
    width: 6,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  cornerAmber: {
    position: "absolute",
    width: 6,
    height: 6,
    backgroundColor: "rgba(245,166,35,0.4)",
  },
  cornerTL: { top: 0, left: 0 },
  cornerTR: { top: 0, right: 0 },
  cornerBL: { bottom: 0, left: 0 },
  cornerBR: { bottom: 0, right: 0 },
});
