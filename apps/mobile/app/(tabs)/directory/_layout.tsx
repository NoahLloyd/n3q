import { Stack } from "expo-router";

export default function DirectoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerTitleStyle: { color: "#fff", fontSize: 16, fontWeight: "600" },
        headerStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Directory" }} />
      <Stack.Screen name="[id]" options={{ title: "" }} />
    </Stack>
  );
}
