"use client";

import { useEffect, useState } from "react";
import {
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
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
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

interface EventDetailModalProps {
  eventId: string | null;
  onClose: () => void;
  onDeleted?: () => void;
}

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

const EVENT_TIMEZONE = "Europe/Copenhagen";

function formatICSTime(timeStr: string): string {
  const parts = timeStr.split(":");
  return `${parts[0]}${parts[1]}${parts[2] ? parts[2] : "00"}`;
}

function generateSingleEventICS(event: Event): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const uid = `${event.id}@n3q.events`;
  const created = new Date(event.created_at)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  let dateProps: string;

  if (event.event_time) {
    const dateFormatted = event.event_date.replace(/-/g, "");
    const dtstart = `${dateFormatted}T${formatICSTime(event.event_time)}`;

    let dtend: string;
    if (event.event_end_time) {
      dtend = `${dateFormatted}T${formatICSTime(event.event_end_time)}`;
    } else {
      const timeParts = event.event_time.split(":");
      const endHour = String(Math.min(parseInt(timeParts[0], 10) + 2, 23)).padStart(2, "0");
      dtend = `${dateFormatted}T${endHour}${timeParts[1]}00`;
    }
    dateProps = `DTSTART;TZID=${EVENT_TIMEZONE}:${dtstart}\nDTEND;TZID=${EVENT_TIMEZONE}:${dtend}`;
  } else {
    const dtstart = event.event_date.replace(/-/g, "");
    const nextDay = new Date(event.event_date + "T12:00:00");
    nextDay.setDate(nextDay.getDate() + 1);
    const dtend = nextDay.toISOString().split("T")[0].replace(/-/g, "");
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

export function EventDetailModal({ eventId, onClose, onDeleted }: EventDetailModalProps) {
  const { userId: address } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!eventId || !address) return;

    setIsLoading(true);
    setShowDeleteConfirm(false);
    fetchEvent(eventId, address).then((data) => {
      setEvent(data);
      setIsLoading(false);
    });
  }, [eventId, address]);

  if (!eventId) return null;

  const isCreator =
    address && event?.creator_id.toLowerCase() === address.toLowerCase();
  const isEmailIngested = !!event?.ical_uid;
  const canDelete = isCreator || isEmailIngested;
  const hasRsvp = event?.user_has_rsvp;
  const isPast = event ? isEventPast(event.event_date) : false;

  const handleRsvp = async () => {
    if (!address || !event) return;
    setActionLoading("rsvp");
    try {
      await rsvpEvent(event.id, address);
      const updated = await fetchEvent(event.id, address);
      setEvent(updated);
    } catch (error) {
      console.error("Error RSVPing:", error);
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
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!address || !event) return;
    setActionLoading("delete");
    try {
      await deleteEvent(event.id, address);
      onDeleted?.();
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
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

  const formattedDate = event ? formatEventDate(event.event_date) : "";
  const formattedTime = event ? formatEventTime(event.event_time) : null;
  const isLocationUrl = event?.location?.startsWith("http");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <Card className="relative z-10 w-full max-w-lg mx-4 rounded-none shadow-lg max-h-[85vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex-1 min-w-0 pr-4">
            {isLoading ? (
              <div className="h-6 w-48 bg-muted animate-pulse" />
            ) : event ? (
              <div className="flex items-start gap-2">
                <CardTitle className="text-base font-semibold leading-tight">
                  {event.title}
                </CardTitle>
                {isPast && (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    Past
                  </Badge>
                )}
              </div>
            ) : (
              <CardTitle className="text-base">Event not found</CardTitle>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        {isLoading ? (
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </CardContent>
        ) : event ? (
          <CardContent className="space-y-4">
            {/* Date/time/location */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formattedDate}
              </span>
              {formattedTime ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formattedTime}
                  {event.event_end_time &&
                    ` - ${formatEventTime(event.event_end_time)}`}
                </span>
              ) : (
                <Badge variant="outline" className="text-xs w-fit">
                  All day
                </Badge>
              )}
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
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
                    <span>{event.location}</span>
                  )}
                </div>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {event.rsvp_count || 0} attending
              </span>
            </div>

            {/* Description */}
            {event.description && (
              <div className="border-t border-border pt-3">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(event.description),
                  }}
                />
              </div>
            )}

            {/* Attendees */}
            {event.rsvps && event.rsvps.length > 0 && (
              <div className="border-t border-border pt-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Attending ({event.rsvps.length})
                </p>
                <div className="space-y-2">
                  {event.rsvps.slice(0, 5).map((rsvp) => {
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
                      <div key={rsvp.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={rsvp.user?.avatar_url || undefined}
                            alt={displayName}
                          />
                          <AvatarFallback className="text-[8px]">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`text-xs ${!rsvp.user?.display_name ? "font-mono" : ""}`}>
                          {displayName}
                        </span>
                      </div>
                    );
                  })}
                  {event.rsvps.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{event.rsvps.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t border-border pt-3 flex flex-wrap items-center gap-2">
              {!isPast && !hasRsvp && (
                <Button
                  onClick={handleRsvp}
                  disabled={actionLoading === "rsvp"}
                  size="sm"
                  className="gap-1.5"
                >
                  {actionLoading === "rsvp" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="h-3.5 w-3.5" />
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
                  className="gap-1.5"
                >
                  {actionLoading === "cancel" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <UserMinus className="h-3.5 w-3.5" />
                  )}
                  Cancel RSVP
                </Button>
              )}

              <Button
                onClick={handleDownloadICS}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Add to Calendar
              </Button>

              {canDelete && (
                <>
                  {!showDeleteConfirm ? (
                    <Button
                      onClick={() => setShowDeleteConfirm(true)}
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-red-500 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">Sure?</span>
                      <Button
                        onClick={handleDelete}
                        disabled={actionLoading === "delete"}
                        variant="destructive"
                        size="sm"
                      >
                        {actionLoading === "delete" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Yes"
                        )}
                      </Button>
                      <Button
                        onClick={() => setShowDeleteConfirm(false)}
                        variant="outline"
                        size="sm"
                      >
                        No
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Meta */}
            <p className="text-[11px] text-muted-foreground">
              Created {formatDistanceToNow(new Date(event.created_at))}
              {event.creator && (
                <>
                  {" "}by{" "}
                  {event.creator.display_name ||
                    `${event.creator_id.slice(0, 6)}...`}
                </>
              )}
            </p>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">Event not found.</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
