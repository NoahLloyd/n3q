import { useState, useCallback, useMemo } from "react";
import { View, Text, SectionList, RefreshControl, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, Stack, useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/src/lib/theme";
import { getNotifications, markAllRead, type StoredNotification } from "@/src/lib/notification-store";
import { formatDistanceToNow } from "@n3q/shared";

function PixelArrow() {
  return (
    <Svg width={14} height={10} viewBox="0 0 88 63">
      <Path d="M0 24.9697H12.4848V12.4848H24.9697V24.9697H87.3939V37.4545H24.9697V49.9394H12.4848V37.4545H0V24.9697ZM24.9697 0H37.4545V12.4848H24.9697V0ZM24.9697 49.9394H37.4545V62.4242H24.9697V49.9394Z" fill="#6A6B60" />
    </Svg>
  );
}

function groupByDate(notifications: StoredNotification[]) {
  const groups: Record<string, StoredNotification[]> = {};

  for (const n of notifications) {
    const date = new Date(n.date);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    let label: string;
    if (days === 0 && date.toDateString() === now.toDateString()) {
      label = "Today";
    } else if (days <= 1) {
      label = "Yesterday";
    } else if (days <= 7) {
      label = "This Week";
    } else {
      label = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return Object.entries(groups).map(([title, data]) => ({ title, data }));
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const headerHeight = 44 + insets.top;
  const [notifications, setNotifications] = useState<StoredNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    const data = await getNotifications();
    setNotifications(data);
    await markAllRead();
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const sections = useMemo(() => groupByDate(notifications), [notifications]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerStyle: { backgroundColor: "transparent" },
          headerBackVisible: false,
          headerLeft: () => null,
          headerTitle: () => (
            <View style={styles.headerRow}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <PixelArrow />
                <Text style={styles.backText}>back</Text>
              </Pressable>
              <Text style={styles.headerTitle}>Notifications</Text>
              <View style={{ width: 60 }} />
            </View>
          ),
        }}
      />
      <SectionList
        style={styles.container}
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingTop: headerHeight + 12 }]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadNotifications} tintColor={colors.amber} />
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.cardUnread]}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            <Text style={styles.notifBody}>{item.body}</Text>
            <Text style={styles.notifTime}>{formatDistanceToNow(new Date(item.date))}</Text>
          </View>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  headerTitle: { color: "#f5a623", fontSize: 18, fontFamily: "DepartureMono" },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingRight: 16 },
  backText: { fontFamily: "DepartureMono", fontSize: 14, color: "#6A6B60" },
  container: { flex: 1, backgroundColor: colors.pageBg },
  list: { padding: 14 },
  sectionHeader: {
    fontFamily: "DepartureMono",
    fontSize: 11,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
    marginBottom: 8,
  },
  cardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  notifTitle: { color: colors.foreground, fontSize: 14, fontWeight: "500", marginBottom: 4 },
  notifBody: { color: colors.mutedForeground, fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notifTime: { color: colors.mutedForeground, fontSize: 11 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontFamily: "DepartureMono", fontSize: 13, color: colors.mutedForeground },
});
