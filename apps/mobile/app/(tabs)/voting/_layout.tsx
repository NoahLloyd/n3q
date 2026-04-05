import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, View, Text } from "react-native";
import { Plus } from "lucide-react-native";

function HeaderBar() {
  const router = useRouter();

  return (
    <View style={styles.headerRow}>
      <View style={{ width: 28 }} />
      <Text style={styles.headerTitle}>Voting</Text>
      <Pressable onPress={() => router.push("/(tabs)/voting/create")} style={styles.plusBox}>
        <Plus size={16} color="#f5a623" strokeWidth={2.5} />
      </Pressable>
    </View>
  );
}

export default function VotingLayout() {
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
      <Stack.Screen name="create" options={{ title: "Create Poll", presentation: "modal", headerTransparent: false, headerStyle: { backgroundColor: "#0a0a0a" }, headerTintColor: "#fff" }} />
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
