import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { EventsWidget } from "./EventsWidget";
import { ProjectsWidget } from "./ProjectsWidget";
import { QuickActionsWidget } from "./QuickActionsWidget";
import { MemberCardWidget } from "./MemberCardWidget";
import { BrandWidget } from "./BrandWidget";
import type { WidgetEvent, WidgetProject, WidgetProfile } from "../lib/widget-data";

// Widget data is stored in AsyncStorage with these keys
// (written by the same updateWidget* functions that write to iOS UserDefaults)
const STORAGE_KEYS = {
  events: "widget_events_android",
  projects: "widget_projects_android",
  profile: "widget_profile_android",
};

async function loadEvents(): Promise<WidgetEvent[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.events);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function loadProjects(): Promise<WidgetProject[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.projects);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

async function loadProfile(): Promise<WidgetProfile | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.profile);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget, clickAction, clickActionData } = props;

  // Handle click actions — open the app to a specific screen
  if (widgetAction === "WIDGET_CLICK" && clickAction === "OPEN_APP") {
    // The app will handle deep linking via the clickActionData.screen value
    // when the headless task launches the app
    return;
  }

  if (widgetAction === "WIDGET_DELETED") return;

  const { widgetName, width, height } = widgetInfo;

  switch (widgetName) {
    case "EventsWidget": {
      const events = await loadEvents();
      renderWidget(<EventsWidget events={events} width={width} height={height} />);
      break;
    }
    case "ProjectsWidget": {
      const projects = await loadProjects();
      renderWidget(<ProjectsWidget projects={projects} height={height} />);
      break;
    }
    case "QuickActionsWidget": {
      renderWidget(<QuickActionsWidget />);
      break;
    }
    case "MemberCardWidget": {
      const profile = await loadProfile();
      renderWidget(<MemberCardWidget profile={profile} />);
      break;
    }
    case "BrandWidget": {
      renderWidget(<BrandWidget width={width} />);
      break;
    }
  }
}

export { STORAGE_KEYS };
