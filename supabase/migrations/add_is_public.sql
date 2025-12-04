-- Add is_public column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Add is_public column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- Add RLS policy for public projects read access
CREATE POLICY IF NOT EXISTS "Public projects are viewable by everyone"
  ON public.projects
  FOR SELECT
  USING (is_public = true);

-- Add RLS policy for public project members read access  
CREATE POLICY IF NOT EXISTS "Public project members are viewable by everyone"
  ON public.project_members
  FOR SELECT
  USING (
    (SELECT is_public FROM public.projects WHERE id = project_id) = true
  );

-- Add RLS policy for public events read access
CREATE POLICY IF NOT EXISTS "Public events are viewable by everyone"
  ON public.events
  FOR SELECT
  USING (is_public = true);

-- Add RLS policy for public event RSVPs read access
CREATE POLICY IF NOT EXISTS "Public event RSVPs are viewable by everyone"
  ON public.event_rsvps
  FOR SELECT
  USING (
    (SELECT is_public FROM public.events WHERE id = event_id) = true
  );

-- Add RLS policies for content_items and content_interactions (for public knowledge feed)
CREATE POLICY IF NOT EXISTS "Content items are viewable by everyone"
  ON public.content_items
  FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Content interactions are viewable by everyone for counts"
  ON public.content_interactions
  FOR SELECT
  USING (true);

-- Make profiles viewable by everyone (for public directory)
CREATE POLICY IF NOT EXISTS "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

