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

// Deterministic pseudo-random from seed for consistent scratches/marks
function seededRandom(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

/** Paper texture, edge wear, scratches, and vignette overlays */
function CardTexture() {
  // Generate surface scratches — thin lines at slight angles
  const scratches = Array.from({ length: 14 }, (_, i) => {
    const r = seededRandom(i + 7);
    const r2 = seededRandom(i + 31);
    const r3 = seededRandom(i + 53);
    return {
      top: `${r * 90 + 5}%` as const,
      left: `${r2 * 80 + 5}%` as const,
      width: 20 + r3 * 50,
      rotation: -30 + r * 60,
      opacity: 0.02 + r3 * 0.04,
    };
  });

  // Small scuff marks / spots
  const scuffs = Array.from({ length: 20 }, (_, i) => {
    const r = seededRandom(i + 100);
    const r2 = seededRandom(i + 200);
    const r3 = seededRandom(i + 300);
    return {
      top: `${r * 95 + 2}%` as const,
      left: `${r2 * 92 + 3}%` as const,
      size: 1.5 + r3 * 4,
      opacity: 0.03 + r3 * 0.06,
      isLight: r > 0.5,
    };
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Edge vignette — darkening from all four edges inward */}
      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.15, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.5)", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.85, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.45)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.12 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.45)", "transparent"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0.88 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Corner shadow/wear — extra darkening at corners */}
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 0.2 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.4)", "transparent"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.7, y: 0.2 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "transparent"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0.3, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(0,0,0,0.35)", "transparent"]}
        start={{ x: 1, y: 1 }}
        end={{ x: 0.7, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Surface scratches */}
      {scratches.map((s, i) => (
        <View
          key={`s${i}`}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.width,
            height: StyleSheet.hairlineWidth,
            backgroundColor: `rgba(255,240,200,${s.opacity})`,
            transform: [{ rotate: `${s.rotation}deg` }],
          }}
        />
      ))}

      {/* Scuff marks */}
      {scuffs.map((s, i) => (
        <View
          key={`m${i}`}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: s.isLight
              ? `rgba(255,240,200,${s.opacity})`
              : `rgba(0,0,0,${s.opacity + 0.05})`,
          }}
        />
      ))}

      {/* Subtle paper grain — horizontal fiber lines */}
      {Array.from({ length: 8 }, (_, i) => (
        <View
          key={`g${i}`}
          style={{
            position: "absolute",
            top: `${12 + i * 11}%`,
            left: 0,
            right: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: `rgba(180,150,90,${0.015 + seededRandom(i + 400) * 0.02})`,
          }}
        />
      ))}
    </View>
  );
}

/** Worn/chipped corner overlays for physical card feel */
function CornerWear() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top-left corner wear */}
      <View style={[wearStyles.corner, { top: -1, left: -1, borderTopLeftRadius: BORDER_RADIUS }]}>
        <LinearGradient
          colors={["rgba(60,50,30,0.6)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {/* Top-right */}
      <View style={[wearStyles.corner, { top: -1, right: -1, borderTopRightRadius: BORDER_RADIUS }]}>
        <LinearGradient
          colors={["rgba(60,50,30,0.5)", "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {/* Bottom-left */}
      <View style={[wearStyles.corner, { bottom: -1, left: -1, borderBottomLeftRadius: BORDER_RADIUS }]}>
        <LinearGradient
          colors={["rgba(50,40,25,0.7)", "transparent"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      {/* Bottom-right — most worn */}
      <View style={[wearStyles.corner, { bottom: -1, right: -1, borderBottomRightRadius: BORDER_RADIUS }]}>
        <LinearGradient
          colors={["rgba(50,40,25,0.8)", "transparent"]}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const wearStyles = StyleSheet.create({
  corner: {
    position: "absolute",
    width: 35,
    height: 35,
    overflow: "hidden",
  },
});

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
      [0.05, 0.22, 0.45],
      Extrapolation.CLAMP,
    ),
  }));

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        {/* Shadow wrapper — separate from clipped card so glow renders */}
        <Animated.View style={[styles.shadowWrap, cardStyle]}>
          <View style={styles.cardOuter}>
            {/* Card edge — dark worn border */}
            <View style={styles.cardEdge}>
              {/* Gold trim border */}
              <View style={styles.goldTrim}>
                {/* Inner card body */}
                <LinearGradient
                  colors={["#1a1610", "#14110d", "#0f0d0a", "#14110d", "#1a1610"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardBody}
                >
                  {/* Inner decorative border */}
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
                      colors={["rgba(180,130,50,0.12)", "rgba(180,130,50,0.28)", "rgba(180,130,50,0.12)"]}
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
                        {/* Inner shadow on portrait */}
                        <LinearGradient
                          colors={["rgba(0,0,0,0.5)", "transparent", "transparent", "rgba(0,0,0,0.3)"]}
                          locations={[0, 0.15, 0.85, 1]}
                          style={StyleSheet.absoluteFill}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Type label */}
                  <View style={styles.typeLabel}>
                    <View style={styles.typeLine} />
                    <Text style={styles.typeText}>builder</Text>
                    <View style={styles.typeLine} />
                  </View>

                  {/* Info parchment area */}
                  <View style={styles.parchment}>
                    <LinearGradient
                      colors={["#2c2418", "#251f15", "#201b12", "#251f15"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.parchmentGradient}
                    >
                      <View style={styles.parchmentBorder} />
                      {/* Parchment inner vignette */}
                      <LinearGradient
                        colors={["rgba(0,0,0,0.3)", "transparent", "transparent", "rgba(0,0,0,0.2)"]}
                        locations={[0, 0.2, 0.8, 1]}
                        style={[StyleSheet.absoluteFill, { borderRadius: 3 }]}
                      />
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

            {/* Paper texture & imperfections overlay */}
            <CardTexture />

            {/* Corner wear overlay */}
            <CornerWear />

            {/* Edge highlight — light catching the top edge */}
            <LinearGradient
              colors={["rgba(200,170,100,0.12)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 0.04 }}
              style={[StyleSheet.absoluteFill, { borderRadius: BORDER_RADIUS }]}
              pointerEvents="none"
            />

            {/* Holographic shimmer */}
            <Animated.View style={styles.shimmerContainer} pointerEvents="none">
              <Animated.View style={[styles.shimmerGlow, shimmerStyle]}>
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(220,180,80,0.05)",
                    "rgba(255,245,210,0.16)",
                    "rgba(220,180,80,0.05)",
                    "transparent",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            </Animated.View>
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const INNER_PADDING = 14;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Shadow sits outside the clipped card so glow renders
  shadowWrap: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    shadowColor: "#c89b37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 24,
  },
  cardOuter: {
    flex: 1,
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
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
