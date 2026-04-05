import { Stack } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";

export default function DirectoryLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colorScheme === "dark" ? "#0a0a0a" : "#fff" },
        headerTintColor: colorScheme === "dark" ? "#fff" : "#000",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Directory" }} />
      <Stack.Screen name="[id]" options={{ title: "Profile" }} />
    </Stack>
  );
}
