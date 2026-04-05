import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Image, View, Text } from "react-native";
import { Plus } from "lucide-react-native";
import { useAuth } from "@/src/lib/auth/context";

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
          headerTitleContainerStyle: { left: 12, right: 12 },
          headerLeft: () => null,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "", headerTintColor: "#fff" }} />
      <Stack.Screen name="add" options={{ title: "Add Content", presentation: "modal", headerTransparent: false, headerStyle: { backgroundColor: "#0a0a0a" }, headerTintColor: "#fff" }} />
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
