import { Stack, useRouter } from "expo-router";
import { Pressable, StyleSheet, View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Plus } from "lucide-react-native";

function PixelArrow() {
  return (
    <Svg width={14} height={10} viewBox="0 0 88 63">
      <Path d="M0 24.9697H12.4848V12.4848H24.9697V24.9697H87.3939V37.4545H24.9697V49.9394H12.4848V37.4545H0V24.9697ZM24.9697 0H37.4545V12.4848H24.9697V0ZM24.9697 49.9394H37.4545V62.4242H24.9697V49.9394Z" fill="#6A6B60" />
    </Svg>
  );
}

function BackButton() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.back()} style={styles.backButton}>
      <PixelArrow />
      <Text style={styles.backText}>back</Text>
    </Pressable>
  );
}

function HeaderBar() {
  const router = useRouter();

  return (
    <View style={styles.headerRow}>
      <View style={{ width: 28 }} />
      <Text style={styles.headerTitle}>Events</Text>
      <Pressable onPress={() => router.push("/(tabs)/events/create")} style={styles.plusBox}>
        <Plus size={16} color="#f5a623" strokeWidth={2.5} />
      </Pressable>
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
        headerTitle: () => (
          <View style={styles.modalHeader}>
            <View style={styles.grabber} />
            <Text style={styles.modalTitle}>Create Event</Text>
          </View>
        ),
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
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingRight: 16,
    width: "100%",
  },
  backText: {
    fontFamily: "DepartureMono",
    fontSize: 14,
    color: "#6A6B60",
  },
  modalHeader: {
    alignItems: "center",
    paddingTop: 5,
    gap: 20,
  },
  grabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  modalTitle: {
    color: "#FFA236",
    fontSize: 16,
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
