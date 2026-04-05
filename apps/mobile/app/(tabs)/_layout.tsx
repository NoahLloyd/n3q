import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
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
        {tabs.map((tab, index) => {
          const isActive = state.index === index;
          const color = isActive ? "#f5a623" : "rgba(255, 255, 255, 0.4)";

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.8}
            >
              <tab.Icon size={18} color={color} strokeWidth={2.2} />
              {isActive && <Text style={styles.tabLabel}>{tab.title}</Text>}
            </TouchableOpacity>
          );
        })}
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
