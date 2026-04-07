"use client";

import { useState } from "react";
import { Loader2, Globe, Lock, X } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { createEvent } from "@/lib/supabase/events";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CreateEventModalProps {
  initialDate: string | null;
  onClose: () => void;
  onCreated: (eventId: string) => void;
}

export function CreateEventModal({
  initialDate,
  onClose,
  onCreated,
}: CreateEventModalProps) {
  const { userId: address } = useAuth();
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(initialDate || "");
  const [eventTime, setEventTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!initialDate) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) return;
    if (!title.trim() || !eventDate) return;

    setIsSubmitting(true);
    try {
      const event = await createEvent(
        address,
        title.trim(),
        eventDate,
        description.trim() || null,
        location.trim() || null,
        isAllDay ? null : eventTime || null,
        isPublic,
        isAllDay ? null : eventEndTime || null
      );

      if (event) {
        onCreated(event.id);
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert(error instanceof Error ? error.message : "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <Card className="relative z-10 w-full max-w-lg mx-4 rounded-none shadow-lg max-h-[85vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-semibold">New Event</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="modal-title" className="text-sm font-medium">
                What&apos;s happening? <span className="text-red-500">*</span>
              </label>
              <Input
                id="modal-title"
                placeholder="Dinner, workshop, meetup..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-none"
                maxLength={200}
                autoFocus
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="modal-date" className="text-sm font-medium">
                  Date <span className="text-red-500">*</span>
                </label>
                <Input
                  id="modal-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="rounded-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="modal-time" className="text-sm font-medium">
                    Time
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAllDay}
                      onChange={(e) => setIsAllDay(e.target.checked)}
                      className="rounded"
                    />
                    All day
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="modal-time"
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    disabled={isAllDay}
                    className="rounded-none"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">to</span>
                  <Input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    disabled={isAllDay}
                    className="rounded-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-location" className="text-sm font-medium">
                Location
              </label>
              <Input
                id="modal-location"
                placeholder="Address, venue, or video call link"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-none"
                maxLength={500}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="modal-description" className="text-sm font-medium">
                Details
              </label>
              <Textarea
                id="modal-description"
                placeholder="Extra context, agenda, what to bring... (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none rounded-none"
                maxLength={2000}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`flex-1 p-3 border text-left transition-colors ${
                  !isPublic
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  <span className="font-medium text-xs">Members Only</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`flex-1 p-3 border text-left transition-colors ${
                  isPublic
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-border hover:border-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="font-medium text-xs">Public</span>
                </div>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || !title.trim() || !eventDate}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Creating...
                  </>
                ) : (
                  "Create Event"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
