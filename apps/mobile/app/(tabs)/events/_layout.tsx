import { Stack, useRouter } from "expo-router";
import { TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Plus } from "lucide-react-native";

function GlassButton({ onPress, children }: { onPress: () => void; children: React.ReactNode }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.glassTouchable}>
      <BlurView intensity={40} tint="dark" style={styles.glassButton}>
        {children}
      </BlurView>
    </TouchableOpacity>
  );
}

export default function EventsLayout() {
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
          title: "Events",
          headerRightContainerStyle: { justifyContent: "center" },
          headerRight: () => (
            <GlassButton onPress={() => router.push("/(tabs)/events/create")}>
              <Plus size={18} color="#f5a623" strokeWidth={2.5} />
            </GlassButton>
          ),
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "" }} />
      <Stack.Screen name="create" options={{ title: "Create Event", presentation: "modal", headerTransparent: false, headerStyle: { backgroundColor: "#0a0a0a" }, headerTintColor: "#fff" }} />
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
});
