const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function notifyAll(title: string, body: string, data?: Record<string, unknown>) {
  // Fire and forget — don't await, don't block the UI
  fetch(`${API_URL}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "broadcast", title, body, data }),
  }).catch(() => {});
}
