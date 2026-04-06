import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { DeviceMotion } from "expo-sensors";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { colors } from "@/src/lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const MAX_TILT = 12; // degrees

interface TradingCardProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  avatarUrl: string | null;
  initials: string;
  dayCount: number;
}

export function TradingCard({ visible, onClose, name, avatarUrl, initials, dayCount }: TradingCardProps) {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const shimmerX = useSharedValue(0.5);
  const shimmerY = useSharedValue(0.5);
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    scale.value = withSpring(1, { damping: 16, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 250 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const subscription = DeviceMotion.addListener(({ rotation }) => {
      if (!rotation) return;
      // beta = front-back tilt, gamma = left-right tilt
      const { beta, gamma } = rotation;
      rotateX.value = withSpring(beta * MAX_TILT, { damping: 20, stiffness: 100 });
      rotateY.value = withSpring(gamma * MAX_TILT, { damping: 20, stiffness: 100 });
      // Map tilt to shimmer position (0-1)
      shimmerX.value = interpolate(gamma, [-1, 1], [0, 1], Extrapolation.CLAMP);
      shimmerY.value = interpolate(beta, [-1, 1], [0, 1], Extrapolation.CLAMP);
    });

    DeviceMotion.setUpdateInterval(32); // ~30fps

    return () => {
      subscription.remove();
    };
  }, [visible]);

  const handleClose = useCallback(() => {
    scale.value = withTiming(0.85, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(onClose, 220);
  }, [onClose]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${-rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(shimmerX.value, [0, 1], [-CARD_WIDTH * 0.5, CARD_WIDTH * 0.5]) },
      { translateY: interpolate(shimmerY.value, [0, 1], [-CARD_HEIGHT * 0.3, CARD_HEIGHT * 0.3]) },
    ],
    opacity: interpolate(
      Math.abs(shimmerX.value - 0.5) + Math.abs(shimmerY.value - 0.5),
      [0, 0.5, 1],
      [0.08, 0.2, 0.35],
      Extrapolation.CLAMP,
    ),
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View style={[styles.card, cardStyle]}>
          {/* Corner accents */}
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />

          {/* Top border accent line */}
          <View style={styles.topLine} />

          {/* Portrait area */}
          <View style={styles.portraitFrame}>
            <View style={styles.portraitInnerBorder}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.portrait} />
              ) : (
                <View style={[styles.portrait, styles.portraitPlaceholder]}>
                  <Text style={styles.portraitInitials}>{initials}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Name */}
          <Text style={styles.cardName} numberOfLines={1}>{name}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Day count */}
          <Text style={styles.dayLabel}>day {dayCount}</Text>

          {/* Bottom detail line */}
          <View style={styles.bottomDetail}>
            <View style={styles.detailDot} />
            <Text style={styles.detailText}>nine three quarters</Text>
            <View style={styles.detailDot} />
          </View>

          {/* Holographic shimmer overlay */}
          <Animated.View style={[styles.shimmerContainer]} pointerEvents="none">
            <Animated.View style={[styles.shimmerGlow, shimmerStyle]}>
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(245,166,35,0.08)",
                  "rgba(255,255,255,0.15)",
                  "rgba(245,166,35,0.08)",
                  "transparent",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 6,
    height: 6,
    backgroundColor: "rgba(245,166,35,0.5)",
    zIndex: 2,
  },
  cornerTL: { top: 0, left: 0 },
  cornerTR: { top: 0, right: 0 },
  cornerBL: { bottom: 0, left: 0 },
  cornerBR: { bottom: 0, right: 0 },
  topLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(245,166,35,0.3)",
  },
  portraitFrame: {
    width: CARD_WIDTH - 56,
    aspectRatio: 0.82,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 4,
    marginBottom: 20,
  },
  portraitInnerBorder: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(245,166,35,0.15)",
  },
  portrait: {
    width: "100%",
    height: "100%",
  },
  portraitPlaceholder: {
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  portraitInitials: {
    color: colors.amber,
    fontSize: 48,
    fontWeight: "bold",
    fontFamily: "DepartureMono",
  },
  cardName: {
    color: colors.foreground,
    fontSize: 18,
    fontFamily: "DepartureMono",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 8,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: "rgba(245,166,35,0.3)",
    marginBottom: 10,
  },
  dayLabel: {
    color: colors.amber,
    fontSize: 13,
    fontFamily: "DepartureMono",
    letterSpacing: 3,
    marginBottom: 16,
  },
  bottomDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailDot: {
    width: 3,
    height: 3,
    backgroundColor: "rgba(245,166,35,0.4)",
  },
  detailText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 9,
    fontFamily: "DepartureMono",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  shimmerGlow: {
    position: "absolute",
    width: CARD_WIDTH * 1.2,
    height: CARD_HEIGHT * 0.8,
    top: "10%",
    left: "-10%",
  },
  shimmerGradient: {
    width: "100%",
    height: "100%",
  },
});
