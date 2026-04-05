import { useRef, useState } from "react";
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
  Keyboard,
} from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from "react-native-svg";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/lib/auth/context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CODE_LENGTH = 6;

function BackgroundGlow() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="38%" rx="60%" ry="30%">
            <Stop offset="0%" stopColor="#f5a623" stopOpacity="0.1" />
            <Stop offset="50%" stopColor="#f5a623" stopOpacity="0.05" />
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
  const logoWidth = 72;
  const logoHeight = 88;
  const glowOffsetX = (logoWidth - glowSize) / 2;
  const glowOffsetY = (logoHeight - glowSize) / 2;
  return (
    <View style={{ width: logoWidth, height: logoHeight }}>
      <View style={{ position: "absolute", width: glowSize, height: glowSize, top: glowOffsetY, left: glowOffsetX }} pointerEvents="none">
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
      <Svg width={logoWidth} height={logoHeight} viewBox="0 0 104 127">
        <Rect x="0" y="63.4921" width="20.6349" height="63.4921" fill="#FFA236" />
        <Rect x="82.5397" y="63.4921" width="20.6349" height="63.4921" fill="#FFA236" />
        <Rect x="20.6349" y="31.746" width="20.6349" height="31.746" fill="#FFA236" />
        <Rect x="41.2698" y="0" width="20.6349" height="31.746" fill="#FFA236" />
        <Rect x="61.9048" y="31.746" width="20.6349" height="31.746" fill="#FFA236" />
      </Svg>
    </View>
  );
}

export default function LoginScreen() {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { authenticate } = useAuth();
  const router = useRouter();

  function handleDigitChange(index: number, value: string) {
    // Handle paste of full code
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
      if (pasted.length >= CODE_LENGTH) {
        const newDigits = pasted.split("").slice(0, CODE_LENGTH);
        setDigits(newDigits);
        inputRefs.current[CODE_LENGTH - 1]?.focus();
        Keyboard.dismiss();
        submitCode(newDigits.join(""));
        return;
      }
    }

    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (digit && index === CODE_LENGTH - 1) {
      const code = newDigits.join("");
      if (code.length === CODE_LENGTH) {
        Keyboard.dismiss();
        submitCode(code);
      }
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !digits[index] && index > 0) {
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function submitCode(code: string) {
    setIsLoading(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/api/auth/mobile-exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = await response.json();
        Alert.alert("Invalid Code", data.error || "Please check the code and try again.");
        setDigits(Array(CODE_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      const { access_token, refresh_token } = await response.json();
      await authenticate(access_token, refresh_token);
      router.replace("/(tabs)/feed");
    } catch (error) {
      console.error("Auth error:", error);
      Alert.alert("Error", "Failed to connect. Please try again.");
      setDigits(Array(CODE_LENGTH).fill(""));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <BackgroundGlow />

      {/* Glass card */}
      <View style={styles.card}>
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
          Open N3Q on web, go to your profile,{"\n"}and generate a login code.
        </Text>

        {/* Code input — wallet button style */}
        <View style={styles.codeContainer}>
          <View style={[styles.cornerAmber, styles.cornerTL]} />
          <View style={[styles.cornerAmber, styles.cornerTR]} />
          <View style={[styles.cornerAmber, styles.cornerBL]} />
          <View style={[styles.cornerAmber, styles.cornerBR]} />
          <View style={styles.codeRow}>
            {digits.map((digit, i) => (
              <View key={i} style={styles.digitBox}>
                <TextInput
                  ref={(ref) => { inputRefs.current[i] = ref; }}
                  style={styles.digitInput}
                  value={digit}
                  onChangeText={(v) => handleDigitChange(i, v)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={i === 0 ? CODE_LENGTH : 1}
                  selectTextOnFocus
                  caretHidden
                />
                {i < CODE_LENGTH - 1 && <View style={styles.digitSeparator} />}
              </View>
            ))}
          </View>
        </View>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="rgba(245,166,35,0.9)" size="small" />
            <Text style={styles.loadingText}>Verifying...</Text>
          </View>
        )}
      </View>

      {/* Link to web */}
      <TouchableOpacity
        style={styles.webLink}
        onPress={() => WebBrowser.openBrowserAsync("https://www.n3q.house/")}
      >
        <Text style={styles.webLinkText}>
          Generate code at n3q.house
        </Text>
      </TouchableOpacity>
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
    paddingVertical: 48,
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
    marginBottom: 32,
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
    marginBottom: 32,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 32,
  },
  instructions: {
    fontFamily: "DepartureMono",
    fontSize: 11,
    color: "#6A6B60",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.5,
    marginBottom: 28,
  },
  codeContainer: {
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.25)",
    backgroundColor: "rgba(245,166,35,0.03)",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  digitBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  digitInput: {
    fontFamily: "DepartureMono",
    fontSize: 24,
    color: "rgba(245,166,35,0.9)",
    textAlign: "center",
    flex: 1,
    paddingVertical: 8,
  },
  digitSeparator: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(245,166,35,0.12)",
  },
  cornerCard: {
    position: "absolute",
    width: 6,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  cornerAmber: {
    position: "absolute",
    width: 6,
    height: 6,
    backgroundColor: "rgba(245,166,35,0.5)",
  },
  webLink: {
    marginTop: 24,
    alignItems: "center",
  },
  webLinkText: {
    fontFamily: "DepartureMono",
    fontSize: 11,
    color: "#6A6B60",
    letterSpacing: 1,
  },
  cornerTL: { top: 0, left: 0 },
  cornerTR: { top: 0, right: 0 },
  cornerBL: { bottom: 0, left: 0 },
  cornerBR: { bottom: 0, right: 0 },
  loadingRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  loadingText: {
    fontFamily: "DepartureMono",
    fontSize: 11,
    color: "#6A6B60",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
