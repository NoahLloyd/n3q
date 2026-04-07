import { NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const TIMEZONE = "Europe/Copenhagen";

// Generate a valid iCalendar file
function generateICS(events: Array<{
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  event_time: string | null;
  event_end_time: string | null;
  created_at: string;
}>): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//N3Q//Events Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:N3Q Events
X-WR-TIMEZONE:${TIMEZONE}
REFRESH-INTERVAL;VALUE=DURATION:PT1H
X-PUBLISHED-TTL:PT1H
BEGIN:VTIMEZONE
TZID:${TIMEZONE}
X-LIC-LOCATION:${TIMEZONE}
BEGIN:STANDARD
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
END:STANDARD
BEGIN:DAYLIGHT
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
END:DAYLIGHT
END:VTIMEZONE
`;

  for (const event of events) {
    const uid = `${event.id}@n3q.events`;
    const created = new Date(event.created_at)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    // Escape special characters in text fields
    const escapeText = (text: string | null): string => {
      if (!text) return "";
      return text
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
    };

    const summary = escapeText(event.title);
    const rsvpUrl = `https://n3q.house/dashboard/events/${event.id}/rsvp`;
    const descriptionWithRsvp = (event.description ? event.description + "\n\n" : "") + rsvpUrl;
    const description = escapeText(descriptionWithRsvp);
    const location = escapeText(event.location);

    ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
CREATED:${created}
`;

    if (event.event_time) {
      // Format time as local Copenhagen time with TZID — no Date conversion needed
      // event_time is stored as "HH:MM" or "HH:MM:SS"
      const timeParts = event.event_time.split(":");
      const timeFormatted = `${timeParts[0]}${timeParts[1]}${timeParts[2] ? timeParts[2] : "00"}`;
      const dateFormatted = event.event_date.replace(/-/g, "");
      const dtstart = `${dateFormatted}T${timeFormatted}`;

      let dtend: string;
      if (event.event_end_time) {
        const endParts = event.event_end_time.split(":");
        const endFormatted = `${endParts[0]}${endParts[1]}${endParts[2] ? endParts[2] : "00"}`;
        dtend = `${dateFormatted}T${endFormatted}`;
      } else {
        // Default 2 hour duration: add 2 hours to the start time
        const startHour = parseInt(timeParts[0], 10);
        const startMin = timeParts[1];
        const endHour = String(Math.min(startHour + 2, 23)).padStart(2, "0");
        dtend = `${dateFormatted}T${endHour}${startMin}00`;
      }

      ics += `DTSTART;TZID=${TIMEZONE}:${dtstart}
DTEND;TZID=${TIMEZONE}:${dtend}
`;
    } else {
      // All-day event
      const dtstart = event.event_date.replace(/-/g, "");
      const nextDay = new Date(event.event_date + "T12:00:00"); // noon to avoid DST edge cases
      nextDay.setDate(nextDay.getDate() + 1);
      const dtend = nextDay.toISOString().split("T")[0].replace(/-/g, "");

      ics += `DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtend}
`;
    }

    ics += `SUMMARY:${summary}
`;

    ics += `DESCRIPTION:${description}
`;

    if (location) {
      ics += `LOCATION:${location}
`;
    }

    ics += `END:VEVENT
`;
  }

  ics += `END:VCALENDAR`;

  // RFC 5545 requires CRLF line endings
  return ics.replace(/\r?\n/g, "\r\n");
}

export async function GET() {
  try {
    const supabase = createSupabaseBrowserClient();

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      console.error("Error fetching events for calendar:", error);
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      );
    }

    const icsContent = generateICS(events || []);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating calendar:", error);
    return NextResponse.json(
      { error: "Failed to generate calendar" },
      { status: 500 }
    );
  }
}

