"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { useAccount } from "wagmi";
import { fetchEvents } from "@/lib/supabase/events";
import type { Event } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard } from "./components/event-card";
import { CalendarGuideModal } from "./components/calendar-guide-modal";

type FilterOption = "upcoming" | "past";

export default function EventsPage() {
  const { address } = useAccount();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("upcoming");
  const [showCalendarGuide, setShowCalendarGuide] = useState(false);

  // Generate calendar URL
  const calendarUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/calendar`
      : "";

  useEffect(() => {
    if (!address) return;

    const loadEvents = async () => {
      setIsLoading(true);
      const data = await fetchEvents(address, filter);
      setEvents(data);
      setIsLoading(false);
    };

    loadEvents();
  }, [address, filter]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sessions, dinners, and things worth showing up for
          </p>
        </div>
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

      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as FilterOption)}
        className="w-full"
      >
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50">
          <TabsTrigger value="upcoming" className="text-xs">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="text-xs">
            Past
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading events...</p>
      ) : events.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            {filter === "upcoming"
              ? "No upcoming events. Create one!"
              : "No past events yet."}
          </p>
          {filter === "upcoming" && (
            <Link href="/dashboard/events/create" className="mt-4 inline-block">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Create Event
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Calendar Guide Modal */}
      <CalendarGuideModal
        isOpen={showCalendarGuide}
        onClose={() => setShowCalendarGuide(false)}
        calendarUrl={calendarUrl}
      />
    </div>
  );
}
