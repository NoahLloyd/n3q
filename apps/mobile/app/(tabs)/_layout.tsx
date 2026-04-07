import { useEffect } from "react";
import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BookOpen, Rocket, CalendarDays, Vote, Users } from "lucide-react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { LucideIcon } from "lucide-react-native";

const tabs: { name: string; title: string; Icon: LucideIcon }[] = [
  { name: "feed", title: "Knowledge", Icon: BookOpen },
  { name: "projects", title: "Projects", Icon: Rocket },
  { name: "events", title: "Events", Icon: CalendarDays },
  { name: "voting", title: "Voting", Icon: Vote },
  { name: "directory", title: "Directory", Icon: Users },
];

const easeOut = Easing.bezier(0.25, 0.1, 0.25, 1);

function TabItem({ tab, isActive, onPress }: { tab: typeof tabs[0]; isActive: boolean; onPress: () => void }) {
  const progress = useSharedValue(isActive ? 1 : 0);
  const textOpacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    if (isActive) {
      // Expand: ease in with slight delay on text visibility
      progress.value = withTiming(1, { duration: 350, easing: easeOut });
      textOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
    } else {
      // Collapse: fast, text disappears immediately
      textOpacity.value = withTiming(0, { duration: 80 });
      progress.value = withTiming(0, { duration: 150 });
    }
  }, [isActive]);

  const clipStyle = useAnimatedStyle(() => ({
    maxWidth: progress.value * 100,
    overflow: "hidden" as const,
  }));

  const slideStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateX: (1 - progress.value) * -16 }],
  }));

  const color = isActive ? "#f5a623" : "rgba(255, 255, 255, 0.4)";

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <tab.Icon size={18} color={color} strokeWidth={2.2} />
      <Animated.View style={clipStyle}>
        <Animated.Text style={[styles.tabLabel, slideStyle]} numberOfLines={1}>
          {tab.title}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarWrapper, { bottom: Math.max(insets.bottom - 12, 4) }]}>
      <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFill, styles.glass]} />
      <View style={[styles.corner, { top: 0, left: 0 }]} />
      <View style={[styles.corner, { top: 0, right: 0 }]} />
      <View style={[styles.corner, { bottom: 0, left: 0 }]} />
      <View style={[styles.corner, { bottom: 0, right: 0 }]} />

      <View style={styles.tabRow}>
        {tabs.map((tab, index) => (
          <TabItem
            key={tab.name}
            tab={tab}
            isActive={state.index === index}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); navigation.navigate(tab.name); }}
          />
        ))}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="projects" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="voting" />
      <Tabs.Screen name="directory" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    left: 14,
    right: 14,
    height: 60,
    overflow: "hidden",
  },
  glass: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  corner: {
    position: "absolute",
    width: 5,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.25)",
    zIndex: 1,
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "DepartureMono",
    letterSpacing: 0.5,
    color: "#f5a623",
  },
});
