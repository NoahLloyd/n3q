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


