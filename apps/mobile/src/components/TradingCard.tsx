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
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_HEIGHT = CARD_WIDTH * 1.45;
const BORDER_RADIUS = 12;
const MAX_TILT = 12;

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
      const { beta, gamma } = rotation;
      rotateX.value = withSpring(beta * MAX_TILT, { damping: 20, stiffness: 100 });
      rotateY.value = withSpring(gamma * MAX_TILT, { damping: 20, stiffness: 100 });
      shimmerX.value = interpolate(gamma, [-1, 1], [0, 1], Extrapolation.CLAMP);
      shimmerY.value = interpolate(beta, [-1, 1], [0, 1], Extrapolation.CLAMP);
    });

    DeviceMotion.setUpdateInterval(32);

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
      [0.05, 0.18, 0.35],
      Extrapolation.CLAMP,
    ),
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View style={[styles.cardOuter, cardStyle]}>
          {/* Outer glow */}
          <View style={styles.glowLayer} />

          {/* Card edge — dark worn border */}
          <View style={styles.cardEdge}>
            {/* Gold trim border */}
            <View style={styles.goldTrim}>
              {/* Inner card body */}
              <LinearGradient
                colors={["#1a1610", "#12100c", "#0e0c09", "#12100c", "#1a1610"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardBody}
              >
                {/* Top decorative border line */}
                <View style={styles.innerBorderTop} />
                <View style={styles.innerBorderBottom} />
                <View style={styles.innerBorderLeft} />
                <View style={styles.innerBorderRight} />

                {/* Corner diamonds */}
                <View style={[styles.diamond, styles.diamondTL]} />
                <View style={[styles.diamond, styles.diamondTR]} />
                <View style={[styles.diamond, styles.diamondBL]} />
                <View style={[styles.diamond, styles.diamondBR]} />

                {/* Title banner */}
                <View style={styles.titleBanner}>
                  <LinearGradient
                    colors={["rgba(180,130,50,0.15)", "rgba(180,130,50,0.3)", "rgba(180,130,50,0.15)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.titleGradient}
                  >
                    <View style={styles.titleBorderTop} />
                    <View style={styles.titleBorderBottom} />
                    <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
                  </LinearGradient>
                </View>

                {/* Portrait frame */}
                <View style={styles.portraitOuter}>
                  <View style={styles.portraitGoldBorder}>
                    <View style={styles.portraitDarkInset}>
                      {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.portrait} />
                      ) : (
                        <View style={[styles.portrait, styles.portraitPlaceholder]}>
                          <Text style={styles.portraitInitials}>{initials}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {/* Type label between portrait and info */}
                <View style={styles.typeLabel}>
                  <View style={styles.typeLine} />
                  <Text style={styles.typeText}>builder</Text>
                  <View style={styles.typeLine} />
                </View>

                {/* Info parchment area */}
                <View style={styles.parchment}>
                  <LinearGradient
                    colors={["#2a2318", "#231e15", "#1e1a12", "#231e15"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.parchmentGradient}
                  >
                    <View style={styles.parchmentBorder} />
                    <Text style={styles.dayLabel}>day {dayCount}</Text>
                    <View style={styles.parchmentDivider} />
                    <View style={styles.bottomDetail}>
                      <View style={styles.detailDiamond} />
                      <Text style={styles.detailText}>nine three quarters</Text>
                      <View style={styles.detailDiamond} />
                    </View>
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>
          </View>

          {/* Holographic shimmer overlay */}
          <Animated.View style={styles.shimmerContainer} pointerEvents="none">
            <Animated.View style={[styles.shimmerGlow, shimmerStyle]}>
              <LinearGradient
                colors={[
                  "transparent",
                  "rgba(200,160,60,0.06)",
                  "rgba(255,240,200,0.14)",
                  "rgba(200,160,60,0.06)",
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

const INNER_PADDING = 14;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardOuter: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS,
    shadowColor: "#b4822f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  cardEdge: {
    flex: 1,
    backgroundColor: "#1c1812",
    borderRadius: BORDER_RADIUS,
    padding: 3,
  },
  goldTrim: {
    flex: 1,
    borderRadius: BORDER_RADIUS - 2,
    borderWidth: 1.5,
    borderColor: "rgba(180,130,50,0.5)",
    padding: 2,
    overflow: "hidden",
  },
  cardBody: {
    flex: 1,
    borderRadius: BORDER_RADIUS - 4,
    padding: INNER_PADDING,
    overflow: "hidden",
  },

  // Inner decorative border lines
  innerBorderTop: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(180,130,50,0.25)",
  },
  innerBorderBottom: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(180,130,50,0.25)",
  },
  innerBorderLeft: {
    position: "absolute",
    top: 8,
    bottom: 8,
    left: 8,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(180,130,50,0.25)",
  },
  innerBorderRight: {
    position: "absolute",
    top: 8,
    bottom: 8,
    right: 8,
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(180,130,50,0.25)",
  },

  // Corner diamond accents
  diamond: {
    position: "absolute",
    width: 8,
    height: 8,
    backgroundColor: "rgba(200,155,55,0.6)",
    transform: [{ rotate: "45deg" }],
    zIndex: 2,
  },
  diamondTL: { top: 4.5, left: 4.5 },
  diamondTR: { top: 4.5, right: 4.5 },
  diamondBL: { bottom: 4.5, left: 4.5 },
  diamondBR: { bottom: 4.5, right: 4.5 },

  // Title banner
  titleBanner: {
    marginTop: 6,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  titleGradient: {
    paddingVertical: 8,
    alignItems: "center",
  },
  titleBorderTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(200,155,55,0.5)",
  },
  titleBorderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(200,155,55,0.5)",
  },
  cardName: {
    color: "#d4a84b",
    fontSize: 19,
    fontFamily: "DepartureMono",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
    textShadowColor: "rgba(200,155,55,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  // Portrait
  portraitOuter: {
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  portraitGoldBorder: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "rgba(180,130,50,0.45)",
    borderRadius: 4,
    padding: 3,
  },
  portraitDarkInset: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.6)",
    borderRadius: 2,
    overflow: "hidden",
  },
  portrait: {
    width: "100%",
    height: "100%",
  },
  portraitPlaceholder: {
    backgroundColor: "#1a1610",
    alignItems: "center",
    justifyContent: "center",
  },
  portraitInitials: {
    color: "#d4a84b",
    fontSize: 52,
    fontWeight: "bold",
    fontFamily: "DepartureMono",
    textShadowColor: "rgba(200,155,55,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  // Type label
  typeLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  typeLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(180,130,50,0.35)",
  },
  typeText: {
    color: "#c89b37",
    fontSize: 10,
    fontFamily: "DepartureMono",
    letterSpacing: 4,
    textTransform: "uppercase",
  },

  // Parchment info area
  parchment: {
    marginHorizontal: 4,
    borderRadius: 3,
    overflow: "hidden",
  },
  parchmentGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  parchmentBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(180,130,50,0.25)",
    borderRadius: 3,
  },
  dayLabel: {
    color: "#d4a84b",
    fontSize: 16,
    fontFamily: "DepartureMono",
    letterSpacing: 4,
    textShadowColor: "rgba(200,155,55,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  parchmentDivider: {
    width: 50,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(180,130,50,0.3)",
    marginVertical: 10,
  },
  bottomDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailDiamond: {
    width: 4,
    height: 4,
    backgroundColor: "rgba(200,155,55,0.5)",
    transform: [{ rotate: "45deg" }],
  },
  detailText: {
    color: "rgba(200,155,55,0.4)",
    fontSize: 8,
    fontFamily: "DepartureMono",
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  // Shimmer
  shimmerContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS,
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
