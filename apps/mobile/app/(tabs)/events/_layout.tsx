import { Stack, useRouter } from "expo-router";
import { StyleSheet, View, Text } from "react-native";
import { BackButton, ModalHeader, PlusButton } from "@/src/components/Navigation";

function HeaderBar() {
  const router = useRouter();

  return (
    <View style={styles.headerRow}>
      <View style={{ width: 28 }} />
      <Text style={styles.headerTitle}>Events</Text>
      <PlusButton onPress={() => router.push("/(tabs)/events/create")} />
    </View>
  );
}

export default function EventsLayout() {
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
          // @ts-ignore
          headerTitleContainerStyle: { left: 12, right: 12 },
          headerLeft: () => null,
        }}
      />
      <Stack.Screen name="[id]" options={{ title: "", headerBackVisible: false, headerLeft: () => null, headerTitle: () => <BackButton /> }} />
      <Stack.Screen name="create" options={{
        presentation: "modal",
        headerTransparent: false,
        headerStyle: { backgroundColor: "#0a0a0a" },
        headerTintColor: "#fff",
        headerLeft: () => null,
        headerTitle: () => <ModalHeader title="Create Event" />,
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
});
