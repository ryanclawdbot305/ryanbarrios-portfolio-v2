-- ============================================================
-- Pit Wall — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────
-- Extends auth.users with public profile data
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  car text,
  bio text,
  created_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Laps ──────────────────────────────────────────────────
-- Individual lap uploads per user
create table public.laps (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  track text not null,
  layout text default 'Full Course',
  lap_number integer,
  lap_time double precision not null,        -- seconds
  top_speed double precision,
  avg_speed double precision,
  max_lat_g double precision,
  max_lon_g double precision,
  data_sample text,                           -- JSON string of raw lap points (optional)
  created_at timestamptz default now() not null
);

-- ── Leaderboard Entries ───────────────────────────────────
-- Best lap per user per track — canonical leaderboard source
create table public.leaderboard_entries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  track text not null,
  layout text default 'Full Course',
  best_time double precision not null,         -- seconds
  top_speed double precision,
  car text,
  created_at timestamptz default now() not null,
  unique(user_id, track, layout)
);

-- ── Posts ─────────────────────────────────────────────────
-- User posts a lap to a public feed
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  lap_id uuid references public.laps(id) on delete set null,
  caption text,
  created_at timestamptz default now() not null
);

-- ── Row Level Security ────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.laps enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.posts enable row level security;

-- Profiles: anyone can read, only you can update your own
create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Laps: anyone can read, only you can insert/delete your own
create policy "Laps are publicly readable" on public.laps for select using (true);
create policy "Users can insert own laps" on public.laps for insert with check (auth.uid() = user_id);
create policy "Users can delete own laps" on public.laps for delete using (auth.uid() = user_id);

-- Leaderboard: public read, only you can post your best time
create policy "Leaderboard is publicly readable" on public.leaderboard_entries for select using (true);
create policy "Users can upsert own leaderboard entry" on public.leaderboard_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own leaderboard entry" on public.leaderboard_entries
  for update using (auth.uid() = user_id);

-- Posts: public read, only you can post
create policy "Posts are publicly readable" on public.posts for select using (true);
create policy "Users can create own posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts" on public.posts for delete using (auth.uid() = user_id);

-- ── Storage Buckets ──────────────────────────────────────
-- For avatar uploads (optional later)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);

create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

-- ── Indexes ───────────────────────────────────────────────
create index on public.laps (user_id, track);
create index on public.laps (track);
create index on public.leaderboard_entries (track, best_time asc);
create index on public.posts (created_at desc);
