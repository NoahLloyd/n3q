import { Stack } from "expo-router";
import { StyleSheet, View, Text } from "react-native";

function HeaderBar() {
  return (
    <View style={styles.headerRow}>
      <View style={{ width: 28 }} />
      <Text style={styles.headerTitle}>Directory</Text>
      <View style={{ width: 28 }} />
    </View>
  );
}

export default function DirectoryLayout() {
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
