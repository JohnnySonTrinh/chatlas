create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Explorer',
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_length check (char_length(trim(display_name)) between 1 and 24)
);

create table if not exists public.bubbles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  x double precision not null,
  y double precision not null,
  width integer not null,
  height integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bubbles_title_length check (char_length(trim(title)) between 1 and 80),
  constraint bubbles_width_range check (width between 120 and 460),
  constraint bubbles_height_range check (height between 80 and 380)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint messages_content_length check (char_length(trim(content)) between 1 and 320)
);

create table if not exists public.bubble_reports (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  constraint bubble_reports_reason_length check (char_length(trim(reason)) between 0 and 240),
  constraint bubble_reports_unique_reporter unique (bubble_id, reporter_id)
);

create index if not exists bubbles_world_position_idx on public.bubbles (x, y);
create index if not exists bubbles_owner_idx on public.bubbles (owner_id);
create index if not exists messages_bubble_created_idx on public.messages (bubble_id, created_at desc);
create index if not exists messages_user_idx on public.messages (user_id);
create index if not exists bubble_reports_bubble_created_idx on public.bubble_reports (bubble_id, created_at desc);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_bubbles_updated_at on public.bubbles;
create trigger set_bubbles_updated_at
before update on public.bubbles
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_display_name text;
begin
  next_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Explorer'
  );

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(next_display_name, 24),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    display_name = excluded.display_name,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.bubbles enable row level security;
alter table public.messages enable row level security;
alter table public.bubble_reports enable row level security;

drop policy if exists "Profiles are publicly readable" on public.profiles;
create policy "Profiles are publicly readable"
on public.profiles
for select
using (true);

drop policy if exists "Users can insert their profile" on public.profiles;
create policy "Users can insert their profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Bubbles are publicly readable" on public.bubbles;
create policy "Bubbles are publicly readable"
on public.bubbles
for select
using (true);

drop policy if exists "Authenticated users can create bubbles" on public.bubbles;
create policy "Authenticated users can create bubbles"
on public.bubbles
for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Owners can update their bubbles" on public.bubbles;
create policy "Owners can update their bubbles"
on public.bubbles
for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Owners can delete their bubbles" on public.bubbles;
create policy "Owners can delete their bubbles"
on public.bubbles
for delete
to authenticated
using (auth.uid() = owner_id);

drop policy if exists "Messages are publicly readable" on public.messages;
create policy "Messages are publicly readable"
on public.messages
for select
using (true);

drop policy if exists "Authenticated users can send messages" on public.messages;
create policy "Authenticated users can send messages"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.bubbles
    where bubbles.id = bubble_id
  )
);

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select on public.bubbles to anon, authenticated;
grant insert, update, delete on public.bubbles to authenticated;
grant select on public.messages to anon, authenticated;
grant insert on public.messages to authenticated;

drop policy if exists "Users can report bubbles" on public.bubble_reports;
create policy "Users can report bubbles"
on public.bubble_reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Users can view their own reports" on public.bubble_reports;
create policy "Users can view their own reports"
on public.bubble_reports
for select
to authenticated
using (auth.uid() = reporter_id);

grant insert, select on public.bubble_reports to authenticated;

create or replace view public.bubble_summaries
with (security_invoker = true)
as
select
  b.id,
  b.owner_id,
  b.title,
  b.x,
  b.y,
  b.width,
  b.height,
  b.created_at,
  b.updated_at,
  p.display_name as owner_name,
  coalesce(stats.message_count, 0) as message_count,
  coalesce(stats.participant_count, 0) as participant_count,
  stats.recent_message_preview,
  stats.recent_message_at
from public.bubbles b
left join public.profiles p on p.id = b.owner_id
left join lateral (
  select
    count(*)::integer as message_count,
    count(distinct m.user_id)::integer as participant_count,
    (
      array_agg(left(m.content, 140) order by m.created_at desc)
    )[1] as recent_message_preview,
    max(m.created_at) as recent_message_at
  from public.messages m
  where m.bubble_id = b.id
) stats on true;

create or replace view public.messages_with_profiles
with (security_invoker = true)
as
select
  m.id,
  m.bubble_id,
  m.user_id,
  m.content,
  m.created_at,
  p.display_name,
  p.avatar_url
from public.messages m
left join public.profiles p on p.id = m.user_id;

grant select on public.bubble_summaries to anon, authenticated;
grant select on public.messages_with_profiles to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.bubbles;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception
  when duplicate_object then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.bubble_reports;
exception
  when duplicate_object then null;
end;
$$;
