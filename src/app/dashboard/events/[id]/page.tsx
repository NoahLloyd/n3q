"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Trash2,
  Loader2,
  UserPlus,
  UserMinus,
  Download,
  ExternalLink,
} from "lucide-react";
import { useAccount } from "wagmi";
import {
  fetchEvent,
  rsvpEvent,
  cancelRsvp,
  deleteEvent,
} from "@/lib/supabase/events";
import type { Event } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "@/lib/utils";

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

// Simple markdown renderer
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

// Generate .ics content for single event download
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
    const endDate = event.event_end_time
      ? new Date(`${event.event_date}T${event.event_end_time}`)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
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

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { address } = useAccount();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCreator =
    address && event?.creator_id.toLowerCase() === address.toLowerCase();
  const hasRsvp = event?.user_has_rsvp;
  const isPast = event ? isEventPast(event.event_date) : false;

  useEffect(() => {
    if (!address || !id) return;

    const loadEvent = async () => {
      setIsLoading(true);
      const data = await fetchEvent(id, address);
      setEvent(data);
      setIsLoading(false);
    };

    loadEvent();
  }, [address, id]);

  const handleRsvp = async () => {
    if (!address || !event) return;

    setActionLoading("rsvp");
    try {
      await rsvpEvent(event.id, address);
      const updated = await fetchEvent(event.id, address);
      setEvent(updated);
    } catch (error) {
      console.error("Error RSVPing:", error);
      alert(error instanceof Error ? error.message : "Failed to RSVP");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRsvp = async () => {
    if (!address || !event) return;

    setActionLoading("cancel");
    try {
      await cancelRsvp(event.id, address);
      const updated = await fetchEvent(event.id, address);
      setEvent(updated);
    } catch (error) {
      console.error("Error canceling RSVP:", error);
      alert(error instanceof Error ? error.message : "Failed to cancel RSVP");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!address || !event) return;

    setActionLoading("delete");
    try {
      await deleteEvent(event.id, address);
      router.push("/dashboard/events");
    } catch (error) {
      console.error("Error deleting event:", error);
      alert(error instanceof Error ? error.message : "Failed to delete event");
      setActionLoading(null);
      setShowDeleteConfirm(false);
    }
  };

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
          href="/dashboard/events"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Events
        </Link>
        <p className="text-sm text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const formattedDate = formatEventDate(event.event_date);
  const formattedTime = formatEventTime(event.event_time);
  const isLocationUrl = event.location?.startsWith("http");

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-3xl">
      {/* Back link */}
      <Link
        href="/dashboard/events"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Events
      </Link>

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
        {!isPast && !hasRsvp && (
          <Button
            onClick={handleRsvp}
            disabled={actionLoading === "rsvp"}
            size="sm"
            className="gap-2"
          >
            {actionLoading === "rsvp" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            I&apos;m Going
          </Button>
        )}

        {!isPast && hasRsvp && (
          <Button
            onClick={handleCancelRsvp}
            disabled={actionLoading === "cancel"}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {actionLoading === "cancel" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserMinus className="h-4 w-4" />
            )}
            Cancel RSVP
          </Button>
        )}

        <Button
          onClick={handleDownloadICS}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Add to Calendar
        </Button>

        {isCreator && (
          <>
            {!showDeleteConfirm ? (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                size="sm"
                className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">Are you sure?</span>
                <Button
                  onClick={handleDelete}
                  disabled={actionLoading === "delete"}
                  variant="destructive"
                  size="sm"
                >
                  {actionLoading === "delete" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Yes, delete"
                  )}
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
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

      {/* Attendees */}
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Attending ({event.rsvps?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.rsvps && event.rsvps.length > 0 ? (
            <div className="space-y-3">
              {event.rsvps.map((rsvp) => {
                const displayName =
                  rsvp.user?.display_name ||
                  `${rsvp.user_id.slice(0, 6)}...${rsvp.user_id.slice(-4)}`;
                const initials = rsvp.user?.display_name
                  ? rsvp.user.display_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : rsvp.user_id.slice(2, 4).toUpperCase();

                return (
                  <div key={rsvp.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={rsvp.user?.avatar_url || undefined}
                        alt={displayName}
                      />
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          !rsvp.user?.display_name ? "font-mono" : ""
                        }`}
                      >
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        RSVP&apos;d {formatDistanceToNow(new Date(rsvp.created_at))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No one has RSVP&apos;d yet. Be the first!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Event meta */}
      <p className="text-xs text-muted-foreground">
        Created {formatDistanceToNow(new Date(event.created_at))}
        {event.creator && (
          <>
            {" "}
            by{" "}
            {event.creator.display_name || `${event.creator_id.slice(0, 6)}...`}
          </>
        )}
      </p>
    </div>
  );
}

