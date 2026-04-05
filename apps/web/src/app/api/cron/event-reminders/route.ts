import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { sendPushToAll } from "@/lib/push";

// Call this every 15 minutes via a cron job (e.g., Vercel Cron)
// It checks for events starting in the next hour or right now
export async function GET() {
  const client = createSupabaseServiceClient();
  if (!client) {
    return NextResponse.json({ error: "No service client" }, { status: 500 });
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Fetch today's events
  const { data: events } = await client
    .from("events")
    .select("id, title, event_date, event_time")
    .eq("event_date", today)
    .not("event_time", "is", null);

  if (!events || events.length === 0) {
    return NextResponse.json({ checked: 0 });
  }

  let sent = 0;

  for (const event of events) {
    if (!event.event_time) continue;

    const [eventHour, eventMinute] = event.event_time.split(":").map(Number);
    const minutesUntil = (eventHour - currentHour) * 60 + (eventMinute - currentMinute);

    // 1 hour before (between 55-65 minutes to handle cron interval)
    if (minutesUntil >= 55 && minutesUntil <= 65) {
      await sendPushToAll(
        "Event in 1 hour",
        `${event.title} starts in 1 hour`,
        { type: "event", id: event.id }
      );
      sent++;
    }

    // At event time (between -5 and 5 minutes)
    if (minutesUntil >= -5 && minutesUntil <= 5) {
      await sendPushToAll(
        "Event starting now",
        `${event.title} is starting`,
        { type: "event", id: event.id }
      );
      sent++;
    }
  }

  return NextResponse.json({ checked: events.length, sent });
}
