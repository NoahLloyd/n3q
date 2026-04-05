import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Image, View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Plus } from "lucide-react-native";
import { useAuth } from "@/src/lib/auth/context";

function PixelArrow() {
  return (
    <Svg width={14} height={10} viewBox="0 0 88 63">
      <Path d="M0 24.9697H12.4848V12.4848H24.9697V24.9697H87.3939V37.4545H24.9697V49.9394H12.4848V37.4545H0V24.9697ZM24.9697 0H37.4545V12.4848H24.9697V0ZM24.9697 49.9394H37.4545V62.4242H24.9697V49.9394Z" fill="#6A6B60" />
    </Svg>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} style={styles.backButton}>
      <PixelArrow />
      <Text style={styles.backText}>back</Text>
    </Pressable>
  );
}

function HeaderBar() {
  const router = useRouter();
  const { profile } = useAuth();
  const avatarUrl = profile?.avatar_url;
  const initials = profile?.display_name
    ? profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <View style={styles.headerRow}>
      <Pressable onPress={() => router.push("/profile")}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </Pressable>

      <Text style={styles.headerTitle}>Knowledge</Text>

      <Pressable onPress={() => router.push("/(tabs)/feed/add")} style={styles.plusBox}>
        <Plus size={16} color="#f5a623" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

export default function FeedLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderBar />,
          // @ts-ignore – headerTitleContainerStyle works at runtime but isn't in the type defs
          headerTitleContainerStyle: { left: 12, right: 12 },
          headerLeft: () => null,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "", headerBackVisible: false, headerLeft: () => null, headerTitle: () => <BackButton /> }} />
      <Stack.Screen name="add" options={{ title: "Add Content", presentation: "modal", headerTransparent: false, headerStyle: { backgroundColor: "#0a0a0a" }, headerTintColor: "#fff", headerTitleStyle: { color: "#FFA236", fontFamily: "DepartureMono", fontSize: 16 } }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerTitle: {
    color: "#f5a623",
    fontSize: 18,
    fontFamily: "DepartureMono",
  },
  avatar: {
    width: 28,
    height: 28,
    backgroundColor: "#1c1c1c",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarFallback: {
    backgroundColor: "#1c1c1c",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#f5a623",
    fontSize: 11,
    fontWeight: "600",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingRight: 16,
    width: "100%",
  },
  backText: {
    fontFamily: "DepartureMono",
    fontSize: 14,
    color: "#6A6B60",
  },
  plusBox: {
    width: 28,
    height: 28,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },
});
