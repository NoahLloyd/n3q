import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "n3q_notifications";

export interface StoredNotification {
  id: string;
  title: string;
  body: string;
  date: string; // ISO string
  read: boolean;
}

export async function getNotifications(): Promise<StoredNotification[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function addNotification(title: string, body: string): Promise<void> {
  const existing = await getNotifications();
  const notification: StoredNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title,
    body,
    date: new Date().toISOString(),
    read: false,
  };
  // Keep last 100
  const updated = [notification, ...existing].slice(0, 100);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function markAllRead(): Promise<void> {
  const existing = await getNotifications();
  const updated = existing.map((n) => ({ ...n, read: true }));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter((n) => !n.read).length;
}
