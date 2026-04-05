import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, StyleSheet, Image, View, Text } from "react-native";
import { BlurView } from "expo-blur";
import { Plus } from "lucide-react-native";
import { useAuth } from "@/src/lib/auth/context";

function GlassButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.glassTouchable}>
      <BlurView intensity={40} tint="dark" style={styles.glassButton}>
        {children}
      </BlurView>
    </TouchableOpacity>
  );
}

function ProfileButton({ onPress }: { onPress: () => void }) {
  const { profile } = useAuth();
  const avatarUrl = profile?.avatar_url;
  const initials = profile?.display_name
    ? profile.display_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.1} style={styles.profileTouchable}>
      <View style={styles.profileButton}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
        ) : (
          <View style={styles.profileFallback}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function FeedLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerTitleStyle: { color: "#f5a623", fontSize: 18, fontFamily: "DepartureMono" },
        headerStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Knowledge",
          headerLeftContainerStyle: { justifyContent: "center" },
          headerRightContainerStyle: { justifyContent: "center" },
          headerLeft: () => (
            <ProfileButton onPress={() => router.push("/profile")} />
          ),
          headerRight: () => (
            <GlassButton onPress={() => router.push("/(tabs)/feed/add")}>
              <Plus size={18} color="#f5a623" strokeWidth={2.5} />
            </GlassButton>
          ),
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "" }} />
      <Stack.Screen name="add" options={{ title: "Add Content", presentation: "modal", headerTransparent: false, headerStyle: { backgroundColor: "#0a0a0a" }, headerTintColor: "#fff" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  glassTouchable: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  glassButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  profileTouchable: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  profileFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    color: "#f5a623",
    fontSize: 12,
    fontWeight: "600",
  },
});
