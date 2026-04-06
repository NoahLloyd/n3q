import { View, Text, StyleSheet } from "react-native";
import { colors } from "@/src/lib/theme";

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  text: {
    fontFamily: "DepartureMono",
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: "center",
    letterSpacing: 0.5,
  },
});
