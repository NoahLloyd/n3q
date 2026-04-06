import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, Image, View, Text } from "react-native";
import { useAuth } from "@/src/lib/auth/context";
import { BackButton, ModalHeader, PlusButton } from "@/src/components/Navigation";

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

      <PlusButton onPress={() => router.push("/(tabs)/feed/add")} />
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
      <Stack.Screen name="add" options={{
        presentation: "modal",
        headerTransparent: false,
        headerStyle: { backgroundColor: "#0a0a0a" },
        headerTintColor: "#fff",
        headerLeft: () => null,
        headerTitle: () => <ModalHeader title="Add Content" />,
      }} />
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
});
