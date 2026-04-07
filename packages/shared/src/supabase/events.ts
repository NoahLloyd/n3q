import type { SupabaseClient } from "@supabase/supabase-js";
import type { Event, EventRsvp, Profile } from "../types";

async function getProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function fetchEvents(
  supabase: SupabaseClient,
  userId: string,
  filter: "upcoming" | "past" = "upcoming"
): Promise<Event[]> {
  const today = new Date().toISOString().split("T")[0];

  let query = supabase.from("events").select("*");

  if (filter === "upcoming") {
    query = query.gte("event_date", today).order("event_date", { ascending: true });
  } else {
    query = query.lt("event_date", today).order("event_date", { ascending: false });
  }

  const { data: events, error } = await query;

  if (error) {
    console.error("Error fetching events:", error);
    return [];
  }

  // Get RSVP counts and check user RSVP for all events
  const eventIds = (events || []).map((e) => e.id);

  const { data: allRsvps } = await supabase
    .from("event_rsvps")
    .select("*")
    .in("event_id", eventIds);

  // Fetch creator profiles
  const creatorIds = [...new Set((events || []).map((e) => e.creator_id))];
  const profiles: Record<string, Profile> = {};

  for (const id of creatorIds) {
    const profile = await getProfile(supabase, id);
    if (profile) profiles[id] = profile;
  }

  // Fetch profiles for RSVP users (for avatar display)
  const rsvpUserIds = [...new Set((allRsvps || []).map((r) => r.user_id))];
  const rsvpProfiles: Record<string, Profile> = {};

  for (const id of rsvpUserIds) {
    const profile = await getProfile(supabase, id);
    if (profile) rsvpProfiles[id] = profile;
  }

  return (events || []).map((event) => {
    const eventRsvps = (allRsvps || []).filter((r) => r.event_id === event.id);
    const userHasRsvp = eventRsvps.some(
      (r) => r.user_id.toLowerCase() === userId.toLowerCase()
    );

    // Get first 3 RSVP profiles for avatar display
    const rsvp_profiles = eventRsvps
      .slice(0, 3)
      .map((r) => rsvpProfiles[r.user_id])
      .filter(Boolean) as Profile[];

    return {
      ...event,
      creator: profiles[event.creator_id] || null,
      rsvp_count: eventRsvps.length,
      rsvp_profiles,
      user_has_rsvp: userHasRsvp,
    };
  });
}

export async function fetchEvent(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<Event | null> {
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error) {
    console.error("Error fetching event:", error);
    return null;
  }

  // Fetch RSVPs with profiles
  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  // Fetch profiles for all RSVPs
  const rsvpUserIds = [...new Set((rsvps || []).map((r) => r.user_id))];
  const profiles: Record<string, Profile> = {};

  for (const id of rsvpUserIds) {
    const profile = await getProfile(supabase, id);
    if (profile) profiles[id] = profile;
  }

  // Fetch creator profile
  const creator = await getProfile(supabase, event.creator_id);

  const rsvpsWithProfiles: EventRsvp[] = (rsvps || []).map((r) => ({
    ...r,
    user: profiles[r.user_id] || null,
  }));

  const userHasRsvp = rsvpsWithProfiles.some(
    (r) => r.user_id.toLowerCase() === userId.toLowerCase()
  );

  return {
    ...event,
    creator,
    rsvps: rsvpsWithProfiles,
    rsvp_count: rsvpsWithProfiles.length,
    user_has_rsvp: userHasRsvp,
  };
}

export async function createEvent(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  eventDate: string,
  description: string | null,
  location: string | null,
  eventTime: string | null,
  isPublic: boolean = false,
  eventEndTime: string | null = null
): Promise<Event | null> {
  // Ensure profile exists
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  const { data: event, error } = await supabase
    .from("events")
    .insert({
      creator_id: userId,
      title,
      description,
      location,
      event_date: eventDate,
      event_time: eventTime,
      event_end_time: eventEndTime,
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating event:", error);
    throw new Error(error.message);
  }

  return fetchEvent(supabase, event.id, userId);
}

export async function deleteEvent(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<boolean> {
  // Verify ownership
  const { data: event } = await supabase
    .from("events")
    .select("creator_id")
    .eq("id", eventId)
    .single();

  if (!event || event.creator_id.toLowerCase() !== userId.toLowerCase()) {
    throw new Error("Only the event creator can delete this event");
  }

  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) {
    console.error("Error deleting event:", error);
    throw new Error(error.message);
  }

  return true;
}

export async function rsvpEvent(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<EventRsvp> {
  // Ensure profile exists
  await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  // Check if already RSVP'd
  const { data: existing } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    throw new Error("You have already RSVP'd to this event");
  }

  const { data: rsvp, error } = await supabase
    .from("event_rsvps")
    .insert({
      event_id: eventId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating RSVP:", error);
    throw new Error(error.message);
  }

  const profile = await getProfile(supabase, userId);

  return {
    ...rsvp,
    user: profile,
  };
}

export async function cancelRsvp(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error canceling RSVP:", error);
    throw new Error(error.message);
  }

  return true;
}

// Fetch all events for calendar feed (no auth required for the API)
export async function fetchAllEventsForCalendar(supabase: SupabaseClient): Promise<Event[]> {
  const { data: events, error } = await supabase
    .from("events")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) {
    console.error("Error fetching events for calendar:", error);
    return [];
  }

  return events || [];
}

// Public functions (no auth required)
export async function fetchPublicEvents(
  supabase: SupabaseClient,
  filter: "upcoming" | "past" = "upcoming"
): Promise<Event[]> {
  const today = new Date().toISOString().split("T")[0];

  let query = supabase.from("events").select("*").eq("is_public", true);

  if (filter === "upcoming") {
    query = query.gte("event_date", today).order("event_date", { ascending: true });
  } else {
    query = query.lt("event_date", today).order("event_date", { ascending: false });
  }

  const { data: events, error } = await query;

  if (error) {
    console.error("Error fetching public events:", error);
    return [];
  }

  // Get RSVP counts for all events
  const eventIds = (events || []).map((e) => e.id);

  const { data: allRsvps } = await supabase
    .from("event_rsvps")
    .select("*")
    .in("event_id", eventIds);

  // Fetch creator profiles
  const creatorIds = [...new Set((events || []).map((e) => e.creator_id))];
  const profiles: Record<string, Profile> = {};

  for (const id of creatorIds) {
    const profile = await getProfile(supabase, id);
    if (profile) profiles[id] = profile;
  }

  // Fetch profiles for RSVP users (for avatar display)
  const rsvpUserIds = [...new Set((allRsvps || []).map((r) => r.user_id))];
  const rsvpProfiles: Record<string, Profile> = {};

  for (const id of rsvpUserIds) {
    const profile = await getProfile(supabase, id);
    if (profile) rsvpProfiles[id] = profile;
  }

  return (events || []).map((event) => {
    const eventRsvps = (allRsvps || []).filter((r) => r.event_id === event.id);

    const rsvp_profiles = eventRsvps
      .slice(0, 3)
      .map((r) => rsvpProfiles[r.user_id])
      .filter(Boolean) as Profile[];

    return {
      ...event,
      creator: profiles[event.creator_id] || null,
      rsvp_count: eventRsvps.length,
      rsvp_profiles,
      user_has_rsvp: false,
    };
  });
}

export async function fetchPublicEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<Event | null> {
  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("is_public", true)
    .single();

  if (error) {
    console.error("Error fetching public event:", error);
    return null;
  }

  // Fetch RSVPs with profiles
  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  // Fetch profiles for all RSVPs
  const rsvpUserIds = [...new Set((rsvps || []).map((r) => r.user_id))];
  const profiles: Record<string, Profile> = {};

  for (const id of rsvpUserIds) {
    const profile = await getProfile(supabase, id);
    if (profile) profiles[id] = profile;
  }

  // Fetch creator profile
  const creator = await getProfile(supabase, event.creator_id);

  const rsvpsWithProfiles: EventRsvp[] = (rsvps || []).map((r) => ({
    ...r,
    user: profiles[r.user_id] || null,
  }));

  return {
    ...event,
    creator,
    rsvps: rsvpsWithProfiles,
    rsvp_count: rsvpsWithProfiles.length,
    user_has_rsvp: false,
  };
}
