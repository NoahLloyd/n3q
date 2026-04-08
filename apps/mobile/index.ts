import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./src/widgets/handler";

registerWidgetTaskHandler(widgetTaskHandler);

// Re-export expo-router entry
import "expo-router/entry";
