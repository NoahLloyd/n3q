import { createSupabaseBrowserClient } from "./client";
import {
  fetchEvents as _fetchEvents,
  fetchEvent as _fetchEvent,
  createEvent as _createEvent,
  deleteEvent as _deleteEvent,
  rsvpEvent as _rsvpEvent,
  cancelRsvp as _cancelRsvp,
  fetchAllEventsForCalendar as _fetchAllEventsForCalendar,
  fetchPublicEvents as _fetchPublicEvents,
  fetchPublicEvent as _fetchPublicEvent,
} from "@n3q/shared";
import type { Event, EventRsvp } from "@n3q/shared";

const supabase = createSupabaseBrowserClient();

export async function fetchEvents(
  userId: string,
  filter: "upcoming" | "past" = "upcoming"
): Promise<Event[]> {
  return _fetchEvents(supabase, userId, filter);
}

export async function fetchEvent(eventId: string, userId: string): Promise<Event | null> {
  return _fetchEvent(supabase, eventId, userId);
}

export async function createEvent(
  userId: string,
  title: string,
  eventDate: string,
  description: string | null,
  location: string | null,
  eventTime: string | null,
  isPublic: boolean = false,
  eventEndTime: string | null = null
): Promise<Event | null> {
  return _createEvent(supabase, userId, title, eventDate, description, location, eventTime, isPublic, eventEndTime);
}

export async function deleteEvent(eventId: string, userId: string): Promise<boolean> {
  return _deleteEvent(supabase, eventId, userId);
}

export async function rsvpEvent(eventId: string, userId: string): Promise<EventRsvp> {
  return _rsvpEvent(supabase, eventId, userId);
}

export async function cancelRsvp(eventId: string, userId: string): Promise<boolean> {
  return _cancelRsvp(supabase, eventId, userId);
}

export async function fetchAllEventsForCalendar(): Promise<Event[]> {
  return _fetchAllEventsForCalendar(supabase);
}

export async function fetchPublicEvents(filter: "upcoming" | "past" = "upcoming"): Promise<Event[]> {
  return _fetchPublicEvents(supabase, filter);
}

export async function fetchPublicEvent(eventId: string): Promise<Event | null> {
  return _fetchPublicEvent(supabase, eventId);
}
