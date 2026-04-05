import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const tabs = [
  { name: "feed", title: "Knowledge", icon: "book" as const },
  { name: "events", title: "Events", icon: "calendar" as const },
  { name: "voting", title: "Voting", icon: "check-square-o" as const },
  { name: "directory", title: "Directory", icon: "users" as const },
];

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarWrapper, { bottom: Math.max(insets.bottom - 12, 4) }]}>
      <BlurView intensity={50} tint="dark" style={[StyleSheet.absoluteFill, styles.glass]} />
      {/* Corner squares */}
      <View style={[styles.corner, { top: 0, left: 0 }]} />
      <View style={[styles.corner, { top: 0, right: 0 }]} />
      <View style={[styles.corner, { bottom: 0, left: 0 }]} />
      <View style={[styles.corner, { bottom: 0, right: 0 }]} />

      <View style={styles.tabRow}>
        {tabs.map((tab, index) => {
          const isActive = state.index === index;
          const color = isActive ? "#f5a623" : "rgba(255, 255, 255, 0.5)";

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.8}
            >
              <FontAwesome name={tab.icon} size={16} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{tab.title}</Text>
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
      <Tabs.Screen name="events" />
      <Tabs.Screen name="voting" />
      <Tabs.Screen name="directory" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    left: 24,
    right: 24,
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
    justifyContent: "space-around",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "DepartureMono",
    letterSpacing: 0.5,
  },
});
