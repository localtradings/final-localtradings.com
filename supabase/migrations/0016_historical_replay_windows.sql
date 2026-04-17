create table if not exists public.historical_replay_windows (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'twelve_data',
  source text not null default 'generated',
  symbol text not null,
  timeframe text not null,
  window_start_at timestamptz not null,
  window_end_at timestamptz not null,
  bars_count integer not null,
  initial_reveal_count integer not null default 250,
  candles_json jsonb not null,
  quality_status text not null default 'ready',
  generated_at timestamptz not null,
  last_used_at timestamptz,
  usage_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists historical_replay_windows_unique_window_idx
on public.historical_replay_windows (provider, symbol, timeframe, window_start_at, bars_count);

create index if not exists historical_replay_windows_selection_quality_generated_idx
on public.historical_replay_windows (symbol, timeframe, quality_status, generated_at desc);

create index if not exists historical_replay_windows_selection_last_used_idx
on public.historical_replay_windows (symbol, timeframe, last_used_at asc, usage_count asc);

create index if not exists historical_replay_windows_window_end_idx
on public.historical_replay_windows (window_end_at);

alter table public.backtest_sessions
add column if not exists historical_window_id uuid references public.historical_replay_windows(id) on delete set null;
