"use client";

import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Event } from "@/lib/supabase/types";

interface EventCardProps {
  event: Event;
}

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
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

export function EventCard({ event }: EventCardProps) {
  const isPast = isEventPast(event.event_date);
  const formattedDate = formatEventDate(event.event_date);
  const formattedTime = formatEventTime(event.event_time);

  // Get first ~100 chars of description for preview
  const descriptionPreview = event.description
    ? event.description
        .replace(/[#*`[\]()]/g, "")
        .replace(/\n+/g, " ")
        .slice(0, 100)
        .trim() + (event.description.length > 100 ? "..." : "")
    : null;

  return (
    <Link href={`/dashboard/events/${event.id}`}>
      <Card
        className={`rounded-none hover:border-sidebar-ring transition-colors cursor-pointer h-full ${
          isPast ? "opacity-60" : ""
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
              {event.title}
            </CardTitle>
            {isPast && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Past
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
            {formattedTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formattedTime}
              </span>
            )}
            {!formattedTime && (
              <span className="text-xs text-muted-foreground">All day</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {descriptionPreview && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {descriptionPreview}
            </p>
          )}

          {event.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.rsvp_count || 0} attending
            </span>
            {event.creator && (
              <span>
                by{" "}
                {event.creator.display_name ||
                  `${event.creator_id.slice(0, 6)}...`}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

