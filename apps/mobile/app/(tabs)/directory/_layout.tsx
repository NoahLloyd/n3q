import { Stack } from "expo-router";

export default function DirectoryLayout() {
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerTitleStyle: { color: "#f5a623", fontSize: 18, fontFamily: "DepartureMono" },
        headerStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Directory" }} />
      <Stack.Screen name="[id]" options={{ title: "" }} />
    </Stack>
  );
}
