const API_URL = process.env.EXPO_PUBLIC_API_URL;

function broadcast(title: string, body: string, data?: Record<string, unknown>) {
  // Fire and forget — don't await, don't block the UI
  fetch(`${API_URL}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "broadcast", title, body, data }),
  }).catch(() => {});
}

// ── Notification messages ──────────────────────────────

export function notifyNewVote(title: string) {
  broadcast("New Vote", title);
}

export function notifyNewEvent(title: string) {
  broadcast("New Event", title);
}

export function notifyProjectNeedsHelp(title: string) {
  broadcast("Help Wanted", `${title} is looking for help`);
}
