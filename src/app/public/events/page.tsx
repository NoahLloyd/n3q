"use client";

import { useEffect, useState } from "react";
import { fetchPublicEvents } from "@/lib/supabase/events";
import type { Event } from "@/lib/supabase/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard } from "@/app/dashboard/events/components/event-card";
import { PublicViewBanner } from "@/components/public-view-banner";

type FilterOption = "upcoming" | "past";

export default function PublicEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterOption>("upcoming");

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      const data = await fetchPublicEvents(filter);
      setEvents(data);
      setIsLoading(false);
    };

    loadEvents();
  }, [filter]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sessions, dinners, and things worth showing up for
          </p>
        </div>
      </div>

      <PublicViewBanner itemType="events" />

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
            <EventCard key={event.id} event={event} isPublic />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            {filter === "upcoming"
              ? "No public upcoming events."
              : "No public past events."}
          </p>
        </div>
      )}
    </div>
  );
}

