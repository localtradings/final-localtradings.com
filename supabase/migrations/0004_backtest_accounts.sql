create table if not exists public.backtest_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade not null unique,
  starting_balance double precision not null default 100000,
  current_balance double precision not null default 100000,
  default_risk_percent double precision not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.backtest_accounts enable row level security;

create policy "Users can read their own backtest account"
on public.backtest_accounts
for select
using (auth.uid() = user_id);

create policy "Users can insert their own backtest account"
on public.backtest_accounts
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own backtest account"
on public.backtest_accounts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own backtest account"
on public.backtest_accounts
for delete
using (auth.uid() = user_id);
