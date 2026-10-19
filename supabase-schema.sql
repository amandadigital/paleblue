-- ==============================================================================
-- paleblue - COMPLETE SUPABASE SETUP FROM SCRATCH
-- Execute this script in your Supabase SQL Editor (zbzckatrmpdlpngypzgd.supabase.co)
-- ==============================================================================

-- 1. Ensure required cryptographic extension exists
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- 2. Create the main `profiles` table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  username text unique not null,
  avatar text default 'pale-dot',
  points integer default 0 not null check (points >= 0),
  games_played integer default 0 not null,
  correct_guesses integer default 0 not null,
  duels_won integer default 0 not null,
  duels_lost integer default 0 not null,
  duels_played integer default 0 not null,
  daily_last_played date,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Grants and Schema Permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on table public.profiles to postgres, anon, authenticated, service_role;

-- 4. Fast Query Indexes
create index if not exists idx_profiles_points on public.profiles (points desc);
create index if not exists idx_profiles_username_lower on public.profiles (lower(username));
create index if not exists idx_profiles_email_lower on public.profiles (lower(email));

-- 5. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- RLS: Public reading (required for leaderboard and looking up usernames)
create policy "Public profiles are viewable by everyone"
  on public.profiles
  for select
  using (true);

-- RLS: Users can insert their own profile matching their Auth UID
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- RLS: Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- 6. Function & Trigger: Automatically create a profile when a user registers
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate_username text;
begin
  -- Resolve username from user_metadata or email prefix
  candidate_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1),
    'explorer_' || floor(random() * 900 + 100)::text
  );

  insert into public.profiles (id, email, username, avatar, points)
  values (
    new.id,
    new.email,
    lower(candidate_username),
    'pale-dot',
    0
  )
  on conflict (id) do update
  set email = excluded.email,
      username = coalesce(public.profiles.username, excluded.username);

  return new;
end;
$$;

-- Bind trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Function & Trigger: Automatic updated_at timestamp maintenance
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 8. Supabase Realtime Setup for Live Leaderboard
-- Enable full replica identity so change broadcasts include all columns
alter table public.profiles replica identity full;

-- Safely add public.profiles to supabase_realtime publication
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end;
$$;
