import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useColorScheme } from "@/components/useColorScheme";

export default function FeedLayout() {
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
          title: "Knowledge",
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.push("/profile")} style={{ marginLeft: 8 }}>
              <FontAwesome name="user-circle-o" size={22} color="#888" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("/(tabs)/feed/add")} style={{ marginRight: 8 }}>
              <FontAwesome name="plus" size={18} color="#f5a623" />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "Content" }} />
      <Stack.Screen name="add" options={{ title: "Add Content", presentation: "modal" }} />
    </Stack>
  );
}
