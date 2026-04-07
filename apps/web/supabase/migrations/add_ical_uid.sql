-- Add ical_uid column for deduplicating events created via calendar invite ingestion
alter table public.events add column if not exists ical_uid text unique;
