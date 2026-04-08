import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface WidgetEvent {
  id: string;
  title: string;
  date: string;
  time: string | null;
  location: string | null;
}

export interface WidgetProject {
  id: string;
  title: string;
  status: string;
  memberCount: number;
}

export interface WidgetProfile {
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  dayCount: number;
}

// iOS: write to UserDefaults via react-native-widgetkit
// Android: write to AsyncStorage + trigger widget update via react-native-android-widget

async function writeToiOS(key: string, value: string) {
  try {
    const { setItem, reloadAllTimelines } = require("react-native-widgetkit");
    await setItem(key, value, "group.com.n3q.app");
    reloadAllTimelines();
  } catch {
    // Widget data sharing not available (e.g., Expo Go)
  }
}

async function updateAndroidWidget(widgetName: string) {
  try {
    const { requestWidgetUpdate } = require("react-native-android-widget");
    const { widgetTaskHandler } = require("../widgets/handler");
    // requestWidgetUpdate calls the task handler which reads from AsyncStorage
    await requestWidgetUpdate({
      widgetName,
      renderWidget: async (info: any) => {
        // The handler will read fresh data from AsyncStorage
        return new Promise<any>((resolve) => {
          widgetTaskHandler({
            widgetInfo: info,
            widgetAction: "WIDGET_UPDATE",
            renderWidget: resolve,
          });
        });
      },
    });
  } catch {
    // Android widget not available
  }
}

export async function updateWidgetEvents(events: WidgetEvent[]) {
  const data = JSON.stringify(events.slice(0, 5));

  if (Platform.OS === "ios") {
    await writeToiOS("widget_events", data);
  } else {
    await AsyncStorage.setItem("widget_events_android", data);
    await updateAndroidWidget("EventsWidget");
  }
}

export async function updateWidgetProjects(projects: WidgetProject[]) {
  const data = JSON.stringify(projects.slice(0, 5));

  if (Platform.OS === "ios") {
    await writeToiOS("widget_projects", data);
  } else {
    await AsyncStorage.setItem("widget_projects_android", data);
    await updateAndroidWidget("ProjectsWidget");
  }
}

export async function updateWidgetProfile(profile: WidgetProfile) {
  const data = JSON.stringify(profile);

  if (Platform.OS === "ios") {
    await writeToiOS("widget_profile", data);
  } else {
    await AsyncStorage.setItem("widget_profile_android", data);
    await updateAndroidWidget("MemberCardWidget");
  }
}

export async function clearWidgetProfile() {
  if (Platform.OS === "ios") {
    await writeToiOS("widget_profile", "");
  } else {
    await AsyncStorage.removeItem("widget_profile_android");
    await updateAndroidWidget("MemberCardWidget");
  }
}
