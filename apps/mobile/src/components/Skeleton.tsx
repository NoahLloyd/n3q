import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";
import { colors } from "@/src/lib/theme";

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.7, { duration: 800 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        { width: width as number, height, backgroundColor: colors.muted },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBlock width="60%" height={14} style={{ marginBottom: 10 }} />
      <SkeletonBlock width="30%" height={10} style={{ marginBottom: 12 }} />
      <SkeletonBlock width="100%" height={10} style={{ marginBottom: 6 }} />
      <SkeletonBlock width="80%" height={10} style={{ marginBottom: 12 }} />
      <View style={styles.footer}>
        <SkeletonBlock width={60} height={10} />
        <SkeletonBlock width={80} height={10} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

export function SkeletonMemberRow() {
  return (
    <View style={styles.memberRow}>
      <SkeletonBlock width={40} height={40} />
      <View style={{ flex: 1, gap: 6 }}>
        <SkeletonBlock width="50%" height={12} />
        <SkeletonBlock width="70%" height={10} />
      </View>
    </View>
  );
}

export function SkeletonMemberList({ count = 8 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonMemberRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 14 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  memberRow: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
