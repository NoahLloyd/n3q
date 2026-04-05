import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useColorScheme } from "@/components/useColorScheme";

export default function VotingLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colorScheme === "dark" ? "#0a0a0a" : "#fff" },
        headerTintColor: colorScheme === "dark" ? "#fff" : "#000",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Voting",
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/(tabs)/voting/create")} style={{ marginRight: 8 }}>
              <FontAwesome name="plus" size={18} color="#f5a623" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "Poll" }} />
      <Stack.Screen name="create" options={{ title: "Create Poll", presentation: "modal" }} />
    </Stack>
  );
}
