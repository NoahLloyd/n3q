"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Download,
  ExternalLink,
} from "lucide-react";
import { fetchPublicEvent } from "@/lib/supabase/events";
import type { Event } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";
import { PublicViewBanner } from "@/components/public-view-banner";

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatEventTime(timeStr: string | null): string | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function isEventPast(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateStr + "T00:00:00");
  return eventDate < today;
}

function renderMarkdown(text: string): string {
  return text
    .replace(
      /^### (.*$)/gm,
      '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>'
    )
    .replace(
      /^## (.*$)/gm,
      '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>'
    )
    .replace(
      /^# (.*$)/gm,
      '<h1 class="text-xl font-semibold mt-4 mb-2">$1</h1>'
    )
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-amber-500 hover:underline">$1</a>'
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-muted px-1.5 py-0.5 text-sm font-mono">$1</code>'
    )
    .replace(/\n/g, "<br />");
}

function generateSingleEventICS(event: Event): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = `${event.id}@n3q.events`;
  const created = new Date(event.created_at)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  let dtstart: string;
  let dtend: string;
  let dateProps: string;

  if (event.event_time) {
    const dateTime = `${event.event_date}T${event.event_time}`;
    const startDate = new Date(dateTime);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    dtstart = startDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    dtend = endDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    dateProps = `DTSTART:${dtstart}\nDTEND:${dtend}`;
  } else {
    dtstart = event.event_date.replace(/-/g, "");
    const nextDay = new Date(event.event_date);
    nextDay.setDate(nextDay.getDate() + 1);
    dtend = nextDay.toISOString().split("T")[0].replace(/-/g, "");
    dateProps = `DTSTART;VALUE=DATE:${dtstart}\nDTEND;VALUE=DATE:${dtend}`;
  }

  const escapeText = (text: string | null): string => {
    if (!text) return "";
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//N3Q//Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
CREATED:${created}
${dateProps}
SUMMARY:${escapeText(event.title)}`;

  if (event.description) {
    ics += `\nDESCRIPTION:${escapeText(event.description)}`;
  }
  if (event.location) {
    ics += `\nLOCATION:${escapeText(event.location)}`;
  }

  ics += `\nEND:VEVENT\nEND:VCALENDAR`;

  return ics;
}

export default function PublicEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadEvent = async () => {
      setIsLoading(true);
      const data = await fetchPublicEvent(id);
      if (!data) {
        setNotFoundState(true);
      } else {
        setEvent(data);
      }
      setIsLoading(false);
    };

    loadEvent();
  }, [id]);

  const handleDownloadICS = () => {
    if (!event) return;
    const icsContent = generateSingleEventICS(event);
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (notFoundState) {
    notFound();
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 max-w-3xl">
        <p className="text-sm text-muted-foreground">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-1 flex-col gap-6 max-w-3xl">
        <Link
          href="/public/events"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Events
        </Link>
        <p className="text-sm text-muted-foreground">
          Event not found or not publicly available.
        </p>
      </div>
    );
  }

  const formattedDate = formatEventDate(event.event_date);
  const formattedTime = formatEventTime(event.event_time);
  const isLocationUrl = event.location?.startsWith("http");
  const isPast = isEventPast(event.event_date);

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/public/events"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Events
      </Link>

      <PublicViewBanner itemType="events" />

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold tracking-tight">{event.title}</h1>
          {isPast && (
            <Badge variant="secondary" className="shrink-0">
              Past Event
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </span>
          {formattedTime ? (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formattedTime}
              {event.event_end_time && ` - ${formatEventTime(event.event_end_time)}`}
            </span>
          ) : (
            <Badge variant="outline" className="text-xs">
              All day
            </Badge>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            {event.rsvp_count || 0} attending
          </span>
        </div>

        {event.location && (
          <div className="flex items-center gap-1.5 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            {isLocationUrl ? (
              <a
                href={event.location}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 hover:underline flex items-center gap-1"
              >
                {event.location}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-muted-foreground">{event.location}</span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleDownloadICS}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Add to Calendar
        </Button>
      </div>

      {/* Description */}
      {event.description && (
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-sm"
              dangerouslySetInnerHTML={{
                __html: renderMarkdown(event.description),
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Attendees - just show count for public */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Attending ({event.rsvp_count || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-amber-500/30 bg-amber-500/5 px-3 py-3 text-xs">
            <p className="text-muted-foreground">
              Attendee details are only visible to N3Q members.{" "}
              <a
                href="https://ninethreequarters.com/apply"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-500 hover:text-amber-400 font-medium"
              >
                Apply to join →
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Event meta - hide creator for public */}
      <p className="text-xs text-muted-foreground">
        Created {formatDistanceToNow(new Date(event.created_at))}
      </p>
    </div>
  );
}

