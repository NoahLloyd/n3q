import React from "react";
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
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import type { Profile } from "@n3q/shared";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Assets
const TEX_PARCHMENT = require("@/assets/images/textures/map-parchment.jpg");
const TEX_GRAIN = require("@/assets/images/textures/card-texture.jpg");
const FLOOR_PLAN = require("@/assets/images/textures/floor-plan.png");

// Palette
const BG = "#0c0a07";
const INK = "#f5a623";
const INK_DIM = "rgba(245,166,35,0.4)";
const INK_FAINT = "rgba(245,166,35,0.15)";

// Deterministic hash
function hash(str: string, seed: number = 0): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

interface MaraudersMapProps {
  visible: boolean;
  onClose: () => void;
}

/** Footstep pair — two small dots side by side like feet */
function Footsteps({ walking }: { walking: boolean }) {
  const leftOpacity = useSharedValue(1);
  const rightOpacity = useSharedValue(0.4);

  React.useEffect(() => {
    if (!walking) return;
    // Alternate feet
    leftOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.3, { duration: 1200 }),
      ), -1, true,
    );
    rightOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ), -1, true,
    );
  }, [walking]);

  const leftStyle = useAnimatedStyle(() => ({ opacity: leftOpacity.value }));
  const rightStyle = useAnimatedStyle(() => ({ opacity: rightOpacity.value }));

  return (
    <View style={styles.feetWrap}>
      <Animated.View style={[styles.foot, { marginRight: 3 }, leftStyle]} />
      <Animated.View style={[styles.foot, { marginLeft: 3 }, rightStyle]} />
    </View>
  );
}

/** A member wandering on the map */
function MemberMarker({ member, index, x, y }: { member: Profile; index: number; x: number; y: number }) {
  const name = member.display_name || "???";

  // Generate 4 waypoints around the base position for wandering
  const wanderRange = 25;
  const wp = Array.from({ length: 4 }, (_, i) => ({
    dx: ((hash(member.id, i * 10 + 1) % (wanderRange * 2)) - wanderRange),
    dy: ((hash(member.id, i * 10 + 2) % (wanderRange * 2)) - wanderRange),
  }));

  // Unique speed per member (6-12 seconds per leg)
  const speed = 6000 + (hash(member.id, 99) % 6000);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    const ease = Easing.inOut(Easing.sin);
    translateX.value = withDelay(
      1600 + index * 100,
      withRepeat(
        withSequence(
          withTiming(wp[0].dx, { duration: speed, easing: ease }),
          withTiming(wp[1].dx, { duration: speed * 0.8, easing: ease }),
          withTiming(wp[2].dx, { duration: speed * 1.1, easing: ease }),
          withTiming(wp[3].dx, { duration: speed * 0.9, easing: ease }),
          withTiming(0, { duration: speed, easing: ease }),
        ), -1, false,
      ),
    );
    translateY.value = withDelay(
      1600 + index * 100,
      withRepeat(
        withSequence(
          withTiming(wp[0].dy, { duration: speed, easing: ease }),
          withTiming(wp[1].dy, { duration: speed * 0.8, easing: ease }),
          withTiming(wp[2].dy, { duration: speed * 1.1, easing: ease }),
          withTiming(wp[3].dy, { duration: speed * 0.9, easing: ease }),
          withTiming(0, { duration: speed, easing: ease }),
        ), -1, false,
      ),
    );
  }, []);

  const wanderStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(1600 + index * 100).duration(500)}
      style={[styles.markerWrap, { left: x, top: y }]}
    >
      <Animated.View style={wanderStyle}>
        <Footsteps walking={true} />
        <Text style={styles.memberName} numberOfLines={1}>
          {name}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

export function MaraudersMap({ visible, onClose }: MaraudersMapProps) {
  const { data: members = [] } = useQuery({
    queryKey: ["directory"],
    queryFn: async (): Promise<Profile[]> => {
      const res = await fetch(`${API_URL}/api/members/list`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.members || [];
    },
    enabled: visible,
  });

  // Scatter members within the visible floor plan area
  // Keep above the bottom gradient (30%) and below the header text
  const pad = 40;
  const headerZone = SCREEN_HEIGHT * 0.28;
  const footerZone = SCREEN_HEIGHT * 0.3;
  const areaW = SCREEN_WIDTH - pad * 2 - 60;
  const areaH = SCREEN_HEIGHT - headerZone - footerZone;

  const positions = members.map((m, i) => ({
    member: m,
    x: pad + (hash(m.id, 1) % areaW),
    y: headerZone + (hash(m.id, 2) % areaH),
  }));

  // Collision resolution — multiple passes to handle cascading overlaps
  const minDistX = 120; // approximate width of name label
  const minDistY = 28;  // approximate height of marker
  for (let pass = 0; pass < 5; pass++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = Math.abs(positions[j].x - positions[i].x);
        const dy = Math.abs(positions[j].y - positions[i].y);
        if (dx < minDistX && dy < minDistY) {
          // Push j away vertically
          positions[j].y += minDistY + 5;
          // Wrap if out of bounds
          if (positions[j].y > headerZone + areaH) {
            positions[j].y = headerZone + 10 + (hash(positions[j].member.id, pass + 50) % 40);
            positions[j].x = pad + (hash(positions[j].member.id, pass + 80) % areaW);
          }
        }
      }
    }
  }

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
      }}>
        <View style={styles.container}>
          {/* Dark parchment background */}
          <Image source={TEX_PARCHMENT}
            style={{ position: "absolute", top: 0, left: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode="cover" />

          {/* Grain overlay */}
          <View style={[StyleSheet.absoluteFill, { experimental_blendMode: "screen" } as any]}>
            <Image source={TEX_GRAIN} style={[StyleSheet.absoluteFill, { opacity: 0.04 }]} resizeMode="cover" />
          </View>

          {/* Floor plan — tinted amber */}
          <Animated.View entering={FadeIn.delay(200).duration(1200)} style={styles.floorPlanWrap}>
            <Image
              source={FLOOR_PLAN}
              style={styles.floorPlan}
              resizeMode="contain"
              tintColor="rgba(245,166,35,0.18)"
            />
          </Animated.View>

          {/* Vignette */}
          <LinearGradient colors={["rgba(245,166,35,0.05)", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 0.2, y: 0 }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["rgba(245,166,35,0.05)", "transparent"]}
            start={{ x: 1, y: 0 }} end={{ x: 0.8, y: 0 }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.1 }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["rgba(0,0,0,0.5)", "transparent"]}
            start={{ x: 0, y: 1 }} end={{ x: 0, y: 0.9 }} style={StyleSheet.absoluteFill} />

          {/* Soft gradient behind header for legibility */}
          <LinearGradient
            colors={["rgba(12,10,7,0.85)", "rgba(12,10,7,0.8)", "transparent"]}
            locations={[0, 0.5, 1]}
            style={styles.headerGradient}
          />

          {/* Header */}
          <View style={styles.header}>
            <Animated.Text entering={FadeIn.delay(400).duration(600)} style={styles.headerLine1}>
              Nine Three Quarters
            </Animated.Text>
            <Animated.Text entering={FadeIn.delay(700).duration(600)} style={styles.headerLine2}>
              are proud to present
            </Animated.Text>
            <Animated.View entering={FadeIn.delay(900).duration(400)} style={styles.divider}>
              <View style={styles.dividerLine} />
              <View style={styles.dividerDiamond} />
              <View style={styles.dividerLine} />
            </Animated.View>
            <Animated.Text entering={FadeIn.delay(1100).duration(800)} style={styles.headerTitle}>
              THE BUILDERS
            </Animated.Text>
          </View>

          {/* Members */}
          {positions.map((p, i) => (
            <MemberMarker key={p.member.id} member={p.member} index={i} x={p.x} y={p.y} />
          ))}

          {/* Bottom fade gradient — mirrors header gradient */}
          <LinearGradient
            colors={["transparent", "rgba(12,10,7,0.8)", "rgba(12,10,7,0.85)"]}
            locations={[0, 0.5, 1]}
            style={styles.bottomGradient}
          />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  // Floor plan
  floorPlanWrap: {
    ...StyleSheet.absoluteFillObject,
    top: SCREEN_HEIGHT * 0.08,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  floorPlan: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },

  // Header gradient
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.38,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.3,
  },

  // Header
  header: { alignItems: "center", paddingTop: SCREEN_HEIGHT * 0.08 },
  headerLine1: {
    fontFamily: "DepartureMono", fontSize: 11, color: "#FFA236",
    letterSpacing: 4, marginBottom: 4,
  },
  headerLine2: {
    fontFamily: "DepartureMono", fontSize: 9, color: "#FFA236",
    letterSpacing: 3, marginBottom: 12,
  },
  divider: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  dividerLine: { width: 30, height: StyleSheet.hairlineWidth, backgroundColor: INK_DIM },
  dividerDiamond: { width: 5, height: 5, backgroundColor: INK_DIM, transform: [{ rotate: "45deg" }] },
  headerTitle: {
    fontFamily: "DepartureMono", fontSize: 22, color: INK, letterSpacing: 8,
    textShadowColor: "rgba(245,166,35,0.25)",
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8,
  },

  // Member markers
  markerWrap: { position: "absolute", width: 140, height: 30 },
  feetWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  foot: {
    width: 3,
    height: 5,
    borderRadius: 1.5,
    backgroundColor: INK,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  memberName: {
    fontFamily: "DepartureMono", fontSize: 11, color: INK_DIM, letterSpacing: 1,
    marginLeft: 1,
  },
});
