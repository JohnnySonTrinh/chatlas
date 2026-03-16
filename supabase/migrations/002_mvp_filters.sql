update public.profiles
set display_name = left(trim(display_name), 24)
where char_length(trim(display_name)) > 24;

alter table public.profiles
drop constraint if exists profiles_display_name_length;

alter table public.profiles
add constraint profiles_display_name_length
check (char_length(trim(display_name)) between 1 and 24);

alter table public.messages
drop constraint if exists messages_content_length;

alter table public.messages
add constraint messages_content_length
check (char_length(trim(content)) between 1 and 320);

create table if not exists public.bubble_reports (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  constraint bubble_reports_reason_length check (char_length(trim(reason)) between 0 and 240),
  constraint bubble_reports_unique_reporter unique (bubble_id, reporter_id)
);

create index if not exists bubble_reports_bubble_created_idx on public.bubble_reports (bubble_id, created_at desc);

alter table public.bubble_reports enable row level security;

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

do $$
begin
  alter publication supabase_realtime add table public.bubble_reports;
exception
  when duplicate_object then null;
end;
$$;
