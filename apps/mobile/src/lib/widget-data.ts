import { setItem, reloadAllTimelines } from "react-native-widgetkit";

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

export async function updateWidgetEvents(events: WidgetEvent[]) {
  try {
    await setItem("widget_events", JSON.stringify(events.slice(0, 5)), "group.com.n3q.app");
    reloadAllTimelines();
  } catch {
    // Widget data sharing not available (e.g., Expo Go)
  }
}

export async function updateWidgetProjects(projects: WidgetProject[]) {
  try {
    await setItem("widget_projects", JSON.stringify(projects.slice(0, 5)), "group.com.n3q.app");
    reloadAllTimelines();
  } catch {
    // Widget data sharing not available
  }
}

export interface WidgetProfile {
  displayName: string;
  initials: string;
  avatarUrl: string | null;
  dayCount: number;
}

export async function updateWidgetProfile(profile: WidgetProfile) {
  try {
    await setItem("widget_profile", JSON.stringify(profile), "group.com.n3q.app");
    reloadAllTimelines();
  } catch {
    // Widget data sharing not available
  }
}
