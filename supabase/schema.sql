-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by authenticated users"
  on public.profiles
  for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- CONTENT ITEMS
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (
    type in (
      'article',
      'blog',
      'book',
      'podcast',
      'video',
      'paper',
      'newsletter',
      'report',
      'dataset',
      'tool',
      'course',
      'event',
      'community',
      'other'
    )
  ),
  url text,
  title text not null,
  ai_title text,
  ai_subtitle text,
  site_name text,
  author text,
  description text,
  image_url text,
  summary text,
  topics text[] default '{}'::text[],
  ai_notes jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.content_items enable row level security;

create policy "Content items are viewable by authenticated users"
  on public.content_items
  for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own content items"
  on public.content_items
  for insert
  with check (auth.uid() = creator_id);

create policy "Users can update their own content items"
  on public.content_items
  for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Users can delete their own content items"
  on public.content_items
  for delete
  using (auth.uid() = creator_id);

-- CONTENT INTERACTIONS
create table if not exists public.content_interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.content_items(id) on delete cascade,
  status text check (status in ('saved', 'done')),
  rating smallint check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table public.content_interactions enable row level security;

create policy "Content interactions are viewable by authenticated users"
  on public.content_interactions
  for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own interactions"
  on public.content_interactions
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own interactions"
  on public.content_interactions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own interactions"
  on public.content_interactions
  for delete
  using (auth.uid() = user_id);

-- POLLS
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  type text not null check (type in ('yes_no_abstain', 'multiple_choice')),
  status text not null default 'active' check (status in ('active', 'closed')),
  yes_count integer not null default 0,
  no_count integer not null default 0,
  abstain_count integer not null default 0,
  winning_option text,
  closed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.polls enable row level security;

create policy "Polls are viewable by authenticated users"
  on public.polls
  for select
  using (auth.role() = 'authenticated');

create policy "Users can create polls"
  on public.polls
  for insert
  with check (auth.uid() = creator_id);

create policy "Users can update their own polls"
  on public.polls
  for update
  using (auth.uid() = creator_id);

create policy "Users can delete their own polls"
  on public.polls
  for delete
  using (auth.uid() = creator_id);

-- POLL OPTIONS (for multiple choice polls)
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null,
  vote_count integer not null default 0,
  position integer not null default 0
);

alter table public.poll_options enable row level security;

create policy "Poll options are viewable by authenticated users"
  on public.poll_options
  for select
  using (auth.role() = 'authenticated');

create policy "Poll creators can insert options"
  on public.poll_options
  for insert
  with check (
    auth.uid() = (select creator_id from public.polls where id = poll_id)
  );

-- VOTES (records who voted, not what they voted for - maintains anonymity)
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(poll_id, user_id)
);

alter table public.votes enable row level security;

create policy "Votes are viewable by authenticated users"
  on public.votes
  for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own votes"
  on public.votes
  for insert
  with check (auth.uid() = user_id);

-- POLL COMMENTS
create table if not exists public.poll_comments (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  upvote_count integer not null default 0,
  created_at timestamptz default now()
);

alter table public.poll_comments enable row level security;

create policy "Poll comments are viewable by authenticated users"
  on public.poll_comments
  for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own comments"
  on public.poll_comments
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.poll_comments
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.poll_comments
  for delete
  using (auth.uid() = user_id);

-- COMMENT UPVOTES (one per user per comment)
create table if not exists public.comment_upvotes (
  comment_id uuid not null references public.poll_comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_upvotes enable row level security;

create policy "Comment upvotes are viewable by authenticated users"
  on public.comment_upvotes
  for select
  using (auth.role() = 'authenticated');

create policy "Users can insert their own upvotes"
  on public.comment_upvotes
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own upvotes"
  on public.comment_upvotes
  for delete
  using (auth.uid() = user_id);

-- PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'idea' check (status in ('idea', 'in_progress', 'looking_for_help', 'completed')),
  is_public boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Projects are viewable by authenticated users"
  on public.projects
  for select
  using (auth.role() = 'authenticated');

create policy "Public projects are viewable by everyone"
  on public.projects
  for select
  using (is_public = true);

create policy "Users can create projects"
  on public.projects
  for insert
  with check (auth.uid() = creator_id);

create policy "Users can update their own projects"
  on public.projects
  for update
  using (auth.uid() = creator_id);

create policy "Users can delete their own projects"
  on public.projects
  for delete
  using (auth.uid() = creator_id);

-- PROJECT MEMBERS
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz default now(),
  unique(project_id, user_id)
);

alter table public.project_members enable row level security;

create policy "Project members are viewable by authenticated users"
  on public.project_members
  for select
  using (auth.role() = 'authenticated');

create policy "Public project members are viewable by everyone"
  on public.project_members
  for select
  using (
    (select is_public from public.projects where id = project_id) = true
  );

create policy "Users can join projects"
  on public.project_members
  for insert
  with check (auth.uid()::text = user_id::text);

create policy "Users can leave projects"
  on public.project_members
  for delete
  using (auth.uid()::text = user_id::text);

-- EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  location text,
  event_date date not null,
  event_time time,
  is_public boolean not null default false,
  created_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Events are viewable by authenticated users"
  on public.events
  for select
  using (auth.role() = 'authenticated');

create policy "Public events are viewable by everyone"
  on public.events
  for select
  using (is_public = true);

create policy "Users can create events"
  on public.events
  for insert
  with check (auth.uid() = creator_id);

create policy "Users can update their own events"
  on public.events
  for update
  using (auth.uid() = creator_id);

create policy "Users can delete their own events"
  on public.events
  for delete
  using (auth.uid() = creator_id);

-- EVENT RSVPS
create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table public.event_rsvps enable row level security;

create policy "Event RSVPs are viewable by authenticated users"
  on public.event_rsvps
  for select
  using (auth.role() = 'authenticated');

create policy "Public event RSVPs are viewable by everyone"
  on public.event_rsvps
  for select
  using (
    (select is_public from public.events where id = event_id) = true
  );

create policy "Users can RSVP to events"
  on public.event_rsvps
  for insert
  with check (auth.uid()::text = user_id::text);

create policy "Users can cancel their RSVPs"
  on public.event_rsvps
  for delete
  using (auth.uid()::text = user_id::text);

-- Update profiles to be viewable by everyone (for public directory)
create policy "Profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

