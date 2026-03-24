create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  display_name text,
  focus_area text,
  bio text,
  updated_at timestamptz default now()
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  quiz_slug text not null,
  score integer not null,
  total_questions integer not null,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  source text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.feedback enable row level security;

create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can upsert their own profile"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read their own quiz attempts"
on public.quiz_attempts
for select
using (auth.uid() = user_id);

create policy "Users can insert their own quiz attempts"
on public.quiz_attempts
for insert
with check (auth.uid() = user_id);

create policy "Service role can insert feedback"
on public.feedback
for insert
with check (true);
