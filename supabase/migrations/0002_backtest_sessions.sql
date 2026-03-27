create table if not exists public.backtest_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null,
  symbol text not null,
  timeframe text not null,
  scenario_id text not null,
  direction text not null,
  entry double precision,
  stop double precision,
  target double precision,
  status text not null default 'draft',
  result_r double precision,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  thesis text not null default '',
  review_notes text not null default '',
  session_state_json jsonb not null default '{}'::jsonb
);

alter table public.backtest_sessions enable row level security;

create policy "Users can read their own backtest sessions"
on public.backtest_sessions
for select
using (auth.uid() = user_id);

create policy "Users can insert their own backtest sessions"
on public.backtest_sessions
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own backtest sessions"
on public.backtest_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own backtest sessions"
on public.backtest_sessions
for delete
using (auth.uid() = user_id);
