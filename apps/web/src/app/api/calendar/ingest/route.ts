import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";

interface PostmarkAttachment {
  Name: string;
  Content: string; // base64
  ContentType: string;
  ContentLength: number;
}

interface PostmarkInboundPayload {
  From: string;
  FromFull: { Email: string; Name: string };
  To: string;
  Subject: string;
  TextBody: string;
  HtmlBody: string;
  Attachments: PostmarkAttachment[];
}

interface ParsedEvent {
  method: string | null;
  uid: string | null;
  summary: string | null;
  description: string | null;
  location: string | null;
  dtstart: string | null;
  dtend: string | null;
}

function parseICS(icsContent: string): ParsedEvent {
  const lines: string[] = [];

  // Unfold continuation lines (lines starting with space/tab are continuations)
  for (const rawLine of icsContent.split(/\r?\n/)) {
    if (rawLine.startsWith(" ") || rawLine.startsWith("\t")) {
      if (lines.length > 0) {
        lines[lines.length - 1] += rawLine.slice(1);
      }
    } else {
      lines.push(rawLine);
    }
  }

  let inEvent = false;
  const event: ParsedEvent = {
    method: null,
    uid: null,
    summary: null,
    description: null,
    location: null,
    dtstart: null,
    dtend: null,
  };

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      continue;
    }
    if (line === "END:VEVENT") break;

    // Parse property:value, handling parameters like DTSTART;TZID=...:value
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const propWithParams = line.slice(0, colonIdx);
    const value = line.slice(colonIdx + 1);
    const prop = propWithParams.split(";")[0].toUpperCase();

    // METHOD is at the calendar level, not inside VEVENT
    if (!inEvent && prop === "METHOD") {
      event.method = value.toUpperCase().trim();
      continue;
    }

    if (!inEvent) continue;

    switch (prop) {
      case "UID":
        event.uid = value;
        break;
      case "SUMMARY":
        event.summary = unescapeICS(value);
        break;
      case "DESCRIPTION":
        event.description = unescapeICS(value);
        break;
      case "LOCATION":
        event.location = unescapeICS(value);
        break;
      case "DTSTART":
        event.dtstart = value;
        break;
      case "DTEND":
        event.dtend = value;
        break;
    }
  }

  return event;
}

function unescapeICS(text: string): string {
  return text
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

// Parse iCal datetime (20260407T143000 or 20260407) into date and time parts
function parseICalDateTime(dt: string): { date: string; time: string | null } {
  // Remove trailing Z for UTC
  const clean = dt.replace(/Z$/, "");

  if (clean.includes("T")) {
    const [datePart, timePart] = clean.split("T");
    const date = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
    const time = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}:${timePart.slice(4, 6) || "00"}`;
    return { date, time };
  }

  // Date only (all-day event)
  const date = `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  return { date, time: null };
}

export async function POST(request: NextRequest) {
  const client = createSupabaseServiceClient();
  if (!client) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 500 });
  }

  let payload: PostmarkInboundPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Find a .ics attachment (prefer text/calendar, fall back to .ics by name)
  const icsAttachment = payload.Attachments?.find(
    (a) =>
      a.ContentType?.startsWith("text/calendar") ||
      a.ContentType === "application/ics" ||
      a.Name?.endsWith(".ics")
  );

  if (!icsAttachment || !icsAttachment.Content) {
    console.log("Calendar ingest: no .ics attachment found, keys:",
      JSON.stringify(payload.Attachments?.map(a => ({ Name: a.Name, ContentType: a.ContentType, hasContent: !!a.Content }))));
    return NextResponse.json({ error: "No calendar attachment" }, { status: 400 });
  }

  // Decode base64 .ics content
  const icsContent = Buffer.from(icsAttachment.Content, "base64").toString("utf-8");
  const parsed = parseICS(icsContent);

  // Handle cancellations — delete the matching event by ical_uid
  if (parsed.method === "CANCEL" && parsed.uid) {
    const { data: existing } = await client
      .from("events")
      .select("id")
      .eq("ical_uid", parsed.uid)
      .maybeSingle();

    if (existing) {
      await client.from("events").delete().eq("id", existing.id);
      console.log(`Calendar ingest: cancelled event ${existing.id} (uid: ${parsed.uid})`);
      return NextResponse.json({ status: "cancelled", eventId: existing.id });
    }

    console.log(`Calendar ingest: cancel for unknown uid ${parsed.uid}, ignoring`);
    return NextResponse.json({ status: "ignored" });
  }

  if (!parsed.summary || !parsed.dtstart) {
    console.log("Calendar ingest: could not parse event from .ics");
    return NextResponse.json({ error: "Could not parse event" }, { status: 400 });
  }

  // Try to match sender to a member profile
  const senderEmail = payload.FromFull?.Email?.toLowerCase();
  let creatorId: string | null = null;

  if (senderEmail) {
    const { data: profile } = await client
      .from("profiles")
      .select("id")
      .ilike("email", senderEmail)
      .maybeSingle();

    creatorId = profile?.id ?? null;
  }

  // If sender isn't a member, use the first available profile as fallback
  if (!creatorId) {
    const { data: fallback } = await client
      .from("profiles")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    creatorId = fallback?.id ?? null;
  }

  if (!creatorId) {
    console.log("Calendar ingest: no profiles exist, cannot create event");
    return NextResponse.json(
      { error: "No profiles available" },
      { status: 500 }
    );
  }

  // Parse date/time
  const start = parseICalDateTime(parsed.dtstart);
  const end = parsed.dtend ? parseICalDateTime(parsed.dtend) : null;

  // Check for existing event by ical_uid — update if found, create if not
  if (parsed.uid) {
    const { data: existing } = await client
      .from("events")
      .select("id")
      .eq("ical_uid", parsed.uid)
      .maybeSingle();

    if (existing) {
      // Update the existing event with new details
      const { error: updateError } = await client
        .from("events")
        .update({
          title: parsed.summary,
          description: parsed.description,
          location: parsed.location,
          event_date: start.date,
          event_time: start.time,
          event_end_time: end?.time ?? null,
        })
        .eq("id", existing.id);

      if (updateError) {
        console.error("Calendar ingest: update error", updateError);
        return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
      }

      console.log(`Calendar ingest: updated event ${existing.id} from ${senderEmail}`);
      return NextResponse.json({ status: "updated", eventId: existing.id });
    }
  }

  // Insert new event
  const { data: event, error } = await client
    .from("events")
    .insert({
      creator_id: creatorId,
      title: parsed.summary,
      description: parsed.description,
      location: parsed.location,
      event_date: start.date,
      event_time: start.time,
      event_end_time: end?.time ?? null,
      is_public: false,
      ical_uid: parsed.uid,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Calendar ingest: insert error", error);
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 });
  }

  console.log(`Calendar ingest: created event ${event.id} from ${senderEmail}`);
  return NextResponse.json({ status: "created", eventId: event.id });
}
