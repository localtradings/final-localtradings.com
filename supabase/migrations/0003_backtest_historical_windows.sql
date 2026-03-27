alter table public.backtest_sessions
add column if not exists window_start_at timestamptz;

alter table public.backtest_sessions
add column if not exists bars_requested integer not null default 250;

update public.backtest_sessions
set window_start_at = coalesce(window_start_at, started_at)
where window_start_at is null;

alter table public.backtest_sessions
alter column window_start_at set not null;

alter table public.backtest_sessions
alter column scenario_id drop not null;
