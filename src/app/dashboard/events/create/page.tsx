"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Globe, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { createEvent } from "@/lib/supabase/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreateEventPage() {
  const router = useRouter();
  const { userId: address } = useAuth();
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isAllDay, setIsAllDay] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert("Please sign in");
      return;
    }

    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    if (!eventDate) {
      alert("Please select a date");
      return;
    }

    setIsSubmitting(true);
    try {
      const event = await createEvent(
        address,
        title.trim(),
        eventDate,
        description.trim() || null,
        location.trim() || null,
        isAllDay ? null : eventTime || null,
        isPublic
      );

      if (event) {
        router.push(`/dashboard/events/${event.id}`);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert(error instanceof Error ? error.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-1 flex-col gap-6 max-w-2xl">
      <div className="space-y-1">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Events
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">
          Create New Event
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="rounded-none">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                What&apos;s happening? <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="Dinner at the usual spot, Workshop on X, etc."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-none"
                maxLength={200}
              />
            </div>

            {/* Date and Time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="date" className="text-sm font-medium">
                  Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={today}
                  className="rounded-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="time" className="text-sm font-medium">
                    Time
                  </label>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllDay}
                      onChange={(e) => setIsAllDay(e.target.checked)}
                      className="rounded"
                    />
                    All day
                  </label>
                </div>
                <Input
                  id="time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  disabled={isAllDay}
                  className="rounded-none"
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                placeholder="Address, venue name, or video call link"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                Optional - can be a physical address or a Zoom/Meet link
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Details
              </label>
              <Textarea
                id="description"
                placeholder="Any extra context, agenda, what to bring, etc. (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none rounded-none"
                maxLength={2000}
              />
            </div>

            {/* Visibility */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Visibility</label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`p-4 border text-left transition-colors ${
                    !isPublic
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    <span className="font-medium text-sm">Members Only</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only N3Q members can see this event
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`p-4 border text-left transition-colors ${
                    isPublic
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="font-medium text-sm">Public</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anyone can view this event, even non-members
                  </p>
                </button>
              </div>
            </div>

            {/* Info box */}
            <div className="p-3 bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              <p>
                <strong>Quick tip:</strong> Events can be as simple as &quot;Coffee
                tomorrow&quot; - you don&apos;t need all the details upfront.
              </p>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Link href="/dashboard/events">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

