import { useEffect, useRef } from "react";
import { Alert, Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabase/client";

const PROMPT_KEY = "n3q_push_prompted";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("Push notifications require a physical device");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === "granted") {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  }

  // Check if we already prompted
  const prompted = await SecureStore.getItemAsync(PROMPT_KEY);
  if (prompted === "true") return null;

  // Show a pre-prompt explaining why
  return new Promise((resolve) => {
    Alert.alert(
      "Stay in the loop",
      "Get notified about new votes, events, and projects from the community.",
      [
        {
          text: "Not now",
          style: "cancel",
          onPress: async () => {
            await SecureStore.setItemAsync(PROMPT_KEY, "true");
            resolve(null);
          },
        },
        {
          text: "Enable",
          onPress: async () => {
            await SecureStore.setItemAsync(PROMPT_KEY, "true");
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== "granted") {
              resolve(null);
              return;
            }
            const tokenData = await Notifications.getExpoPushTokenAsync();
            resolve(tokenData.data);
          },
        },
      ]
    );
  });
}

export function useNotifications(userId: string | null) {
  const tokenSaved = useRef(false);

  useEffect(() => {
    if (!userId || tokenSaved.current) return;

    (async () => {
      const token = await registerForPushNotifications();
      if (!token) return;

      await supabase.from("push_tokens").upsert(
        { user_id: userId, token },
        { onConflict: "token" }
      );

      tokenSaved.current = true;
    })();
  }, [userId]);
}
