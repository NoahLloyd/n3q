import { Stack, useRouter } from "expo-router";
import { StyleSheet, View, Text, Pressable, Alert, Linking } from "react-native";
import { CalendarPlus } from "lucide-react-native";
import { BackButton, ModalHeader, PlusButton } from "@/src/components/Navigation";

const CALENDAR_URL = "https://www.n3q.house/api/calendar";
const WEBCAL_URL = "webcal://www.n3q.house/api/calendar";

function SubscribeButton() {
  async function handleSubscribe() {
    Alert.alert(
      "Subscribe to N3Q Events",
      "Add the N3Q calendar to your preferred calendar app.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subscribe",
          onPress: async () => {
            // webcal:// triggers native calendar subscription on iOS
            const canOpen = await Linking.canOpenURL(WEBCAL_URL);
            if (canOpen) {
              await Linking.openURL(WEBCAL_URL);
            } else {
              // Fallback: copy the URL
              await Linking.openURL(CALENDAR_URL);
            }
          },
        },
      ]
    );
  }

  return (
    <Pressable onPress={handleSubscribe} style={styles.subscribeBox}>
      <CalendarPlus size={16} color="#f5a623" strokeWidth={2.2} />
    </Pressable>
  );
}

function HeaderBar() {
  const router = useRouter();

  return (
    <View style={styles.headerRow}>
      <View style={{ width: 28 }} />
      <Text style={styles.headerTitle}>Events</Text>
      <View style={styles.rightButtons}>
        <SubscribeButton />
        <PlusButton onPress={() => router.push("/(tabs)/events/create")} />
      </View>
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
  rightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  subscribeBox: {
    width: 28,
    height: 28,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.2)",
  },
});
