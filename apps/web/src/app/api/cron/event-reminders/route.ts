import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { sendPushToAll } from "@/lib/push";

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${ampm}`;
}

// Runs every 15 minutes via Vercel Cron
// Checks for event reminders and recently closed votes
export async function GET() {
  const client = createSupabaseServiceClient();
  if (!client) {
    return NextResponse.json({ error: "No service client" }, { status: 500 });
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  let sent = 0;

  // ── Event reminders ────────────────────────────────────

  // Today's events (1 hour before + starting now)
  const { data: todayEvents } = await client
    .from("events")
    .select("id, title, event_date, event_time")
    .eq("event_date", today)
    .not("event_time", "is", null);

  for (const event of todayEvents || []) {
    if (!event.event_time) continue;

    const [eventHour, eventMinute] = event.event_time.split(":").map(Number);
    const minutesUntil = (eventHour - currentHour) * 60 + (eventMinute - currentMinute);

    // 1 hour before (55-65 min window)
    if (minutesUntil >= 55 && minutesUntil <= 65) {
      await sendPushToAll(
        "Starting soon",
        `"${event.title}" starts in about an hour.`,
        { type: "event", id: event.id }
      );
      sent++;
    }

    // Starting now (-5 to 5 min window)
    if (minutesUntil >= -5 && minutesUntil <= 5) {
      await sendPushToAll(
        "Happening now",
        `"${event.title}" is starting.`,
        { type: "event", id: event.id }
      );
      sent++;
    }
  }

  // Tomorrow's events (1 day before reminder, check once between 18:00-18:15)
  if (currentHour === 18 && currentMinute < 15) {
    const { data: tomorrowEvents } = await client
      .from("events")
      .select("id, title, event_date, event_time")
      .eq("event_date", tomorrow);

    for (const event of tomorrowEvents || []) {
      const at = event.event_time ? ` at ${formatTime(event.event_time)}` : "";
      await sendPushToAll(
        "Tomorrow",
        `"${event.title}" is happening tomorrow${at}.`,
        { type: "event", id: event.id }
      );
      sent++;
    }
  }

  // ── Recently closed votes ──────────────────────────────

  // Find votes closed in the last 15 minutes
  const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const { data: closedPolls } = await client
    .from("polls")
    .select("id, title, winning_option, closed_at")
    .eq("status", "closed")
    .gte("closed_at", fifteenMinAgo);

  for (const poll of closedPolls || []) {
    const result = poll.winning_option === "yes" ? "Passed"
      : poll.winning_option === "no" ? "Rejected"
      : poll.winning_option === "tie" ? "Tied"
      : poll.winning_option || "Closed";

    await sendPushToAll(
      "Vote closed",
      `"${poll.title}" — result: ${result}.`,
      { type: "poll", id: poll.id }
    );
    sent++;
  }

  return NextResponse.json({
    checked: {
      todayEvents: todayEvents?.length || 0,
      closedPolls: closedPolls?.length || 0,
    },
    sent,
  });
}
