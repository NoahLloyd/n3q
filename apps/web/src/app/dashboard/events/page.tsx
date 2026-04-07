"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Calendar, ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { fetchEvents } from "@/lib/supabase/events";
import type { Event } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarGuideModal } from "./components/calendar-guide-modal";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function formatTime(timeStr: string | null): string | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Adjust so Monday = 0
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const days: { date: Date; inMonth: boolean }[] = [];

  // Previous month padding
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    days.push({ date: d, inMonth: false });
  }

  // Current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), inMonth: true });
  }

  // Next month padding to fill the grid
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), inMonth: false });
    }
  }

  return days;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function EventsPage() {
  const { userId: address } = useAuth();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendarGuide, setShowCalendarGuide] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const calendarUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/calendar`
      : "";

  useEffect(() => {
    if (!address) return;

    const load = async () => {
      setIsLoading(true);
      const [upcoming, past] = await Promise.all([
        fetchEvents(address, "upcoming"),
        fetchEvents(address, "past"),
      ]);
      setAllEvents(upcoming);
      setPastEvents(past);
      setIsLoading(false);
    };

    load();
  }, [address]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, Event[]> = {};
    for (const event of [...allEvents, ...pastEvents]) {
      const key = event.event_date;
      if (!map[key]) map[key] = [];
      map[key].push(event);
    }
    return map;
  }, [allEvents, pastEvents]);

  const days = useMemo(
    () => getMonthDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const goToToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(now);
  };

  // Events for the selected date, or upcoming events if nothing selected
  const sidebarEvents = useMemo(() => {
    if (selectedDate) {
      const key = dateKey(selectedDate);
      return eventsByDate[key] ?? [];
    }
    return allEvents.slice(0, 8);
  }, [selectedDate, eventsByDate, allEvents]);

  const sidebarTitle = selectedDate
    ? selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "Upcoming";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Events</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowCalendarGuide(true)}
          >
            <Calendar className="h-4 w-4" />
            Subscribe
          </Button>
          <Link href="/dashboard/events/create">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading events...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Calendar grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={prevMonth}
                  className="p-1 hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h2 className="text-sm font-semibold w-40 text-center">
                  {monthLabel}
                </h2>
                <button
                  onClick={nextMonth}
                  className="p-1 hover:bg-muted transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={goToToday}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Today
              </button>
            </div>

            <div className="grid grid-cols-7 border border-border">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="border-b border-border px-2 py-1.5 text-center text-[11px] font-medium text-muted-foreground bg-muted/30"
                >
                  {day}
                </div>
              ))}
              {days.map(({ date, inMonth }, i) => {
                const key = dateKey(date);
                const dayEvents = eventsByDate[key] ?? [];
                const isToday = isSameDay(date, today);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isPast = date < today && !isToday;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedDate(date)}
                    className={`relative min-h-[72px] border-b border-r border-border p-1.5 text-left transition-colors ${
                      !inMonth ? "bg-muted/20 text-muted-foreground/40" : ""
                    } ${isSelected ? "bg-accent" : "hover:bg-muted/40"} ${
                      isPast && inMonth ? "text-muted-foreground" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center text-xs ${
                        isToday
                          ? "bg-foreground text-background font-bold rounded-full"
                          : ""
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 0 && (
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div
                            key={ev.id}
                            className="truncate rounded-sm bg-amber-500/15 px-1 py-0.5 text-[10px] leading-tight text-amber-600 dark:text-amber-400"
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[10px] text-muted-foreground px-1">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar: selected day or upcoming events */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{sidebarTitle}</h3>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Show upcoming
                </button>
              )}
            </div>

            {sidebarEvents.length === 0 ? (
              <div className="border border-dashed border-border py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedDate ? "No events this day" : "No upcoming events"}
                </p>
                {selectedDate && (
                  <Link
                    href={`/dashboard/events/create`}
                  >
                    <Button variant="outline" size="sm" className="gap-2">
                      <Plus className="h-3 w-3" />
                      Create one
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              sidebarEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/dashboard/events/${event.id}`}
                  className="block border border-border p-3 hover:border-foreground/20 transition-colors space-y-2"
                >
                  <div className="text-sm font-medium leading-tight">
                    {event.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    {!selectedDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(event.event_date + "T00:00:00").toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    )}
                    {event.event_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.event_time)}
                        {event.event_end_time && ` - ${formatTime(event.event_end_time)}`}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{event.location}</span>
                      </span>
                    )}
                  </div>
                  {event.rsvp_profiles && event.rsvp_profiles.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {event.rsvp_profiles.slice(0, 4).map((profile) => (
                          <Avatar
                            key={profile.id}
                            className="h-5 w-5 border border-background"
                          >
                            <AvatarImage
                              src={profile.avatar_url || undefined}
                              alt={profile.display_name || ""}
                            />
                            <AvatarFallback className="text-[8px]">
                              {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {event.rsvp_count || 0} going
                      </span>
                    </div>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      <CalendarGuideModal
        isOpen={showCalendarGuide}
        onClose={() => setShowCalendarGuide(false)}
        calendarUrl={calendarUrl}
      />
    </div>
  );
}
