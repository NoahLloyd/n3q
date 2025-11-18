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
  type text not null check (type in ('article', 'book', 'blog', 'podcast', 'video', 'other')),
  url text,
  title text not null,
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


