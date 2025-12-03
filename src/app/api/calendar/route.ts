import { NextResponse } from "next/server";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Generate a valid iCalendar file
function generateICS(events: Array<{
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  event_time: string | null;
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
X-WR-TIMEZONE:UTC
`;

  for (const event of events) {
    const uid = `${event.id}@n3q.events`;
    const created = new Date(event.created_at)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

    // Format date/time
    let dtstart: string;
    let dtend: string;

    if (event.event_time) {
      // Specific time event
      const dateTime = `${event.event_date}T${event.event_time}`;
      const startDate = new Date(dateTime);
      const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Default 2 hour duration

      dtstart = startDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
      dtend = endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    } else {
      // All-day event
      dtstart = event.event_date.replace(/-/g, "");
      // For all-day events, end date is the next day
      const nextDay = new Date(event.event_date);
      nextDay.setDate(nextDay.getDate() + 1);
      dtend = nextDay.toISOString().split("T")[0].replace(/-/g, "");
    }

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
    const description = escapeText(event.description);
    const location = escapeText(event.location);

    ics += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
CREATED:${created}
`;

    if (event.event_time) {
      ics += `DTSTART:${dtstart}
DTEND:${dtend}
`;
    } else {
      ics += `DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtend}
`;
    }

    ics += `SUMMARY:${summary}
`;

    if (description) {
      ics += `DESCRIPTION:${description}
`;
    }

    if (location) {
      ics += `LOCATION:${location}
`;
    }

    ics += `END:VEVENT
`;
  }

  ics += `END:VCALENDAR`;

  return ics;
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
        "Content-Disposition": 'attachment; filename="n3q-events.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
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

