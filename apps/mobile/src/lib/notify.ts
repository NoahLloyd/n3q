const API_URL = process.env.EXPO_PUBLIC_API_URL;

function broadcast(title: string, body: string, data?: Record<string, unknown>) {
  fetch(`${API_URL}/api/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "broadcast", title, body, data }),
  }).catch(() => {});
}

// ── Helpers ────────────────────────────────────────────

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

function formatDate(date: string): string {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

// ── Votes ──────────────────────────────────────────────

export function notifyNewVote(title: string) {
  broadcast("New vote is up", `"${title}" — have your say before it closes.`);
}

export function notifyVoteClosed(title: string, result: string) {
  broadcast("Vote closed", `"${title}" — result: ${result}.`);
}

// ── Events ─────────────────────────────────────────────

export function notifyNewEvent(title: string, date: string, time?: string | null) {
  const when = time ? `${formatDate(date)} at ${formatTime(time)}` : formatDate(date);
  broadcast("New event", `"${title}" — ${when}. Check it out and RSVP.`);
}

export function notifyEventTomorrow(title: string, time?: string | null) {
  const at = time ? ` at ${formatTime(time)}` : "";
  broadcast("Tomorrow", `"${title}" is happening tomorrow${at}.`);
}

export function notifyEventOneHour(title: string) {
  broadcast("Starting soon", `"${title}" starts in about an hour.`);
}

export function notifyEventStarting(title: string) {
  broadcast("Happening now", `"${title}" is starting.`);
}

// ── Projects ───────────────────────────────────────────

export function notifyProjectNeedsHelp(title: string) {
  broadcast("Looking for help", `"${title}" needs contributors — check if you can help.`);
}
