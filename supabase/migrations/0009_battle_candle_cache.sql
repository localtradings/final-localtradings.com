create table if not exists public.battle_candle_cache (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  timeframe text not null,
  provider text not null default 'finnhub',
  bars_count integer not null,
  candles_json jsonb not null,
  last_candle_time bigint not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (symbol, timeframe, provider, bars_count)
);

create index if not exists battle_candle_cache_lookup_idx
on public.battle_candle_cache (symbol, timeframe, provider, expires_at desc);

create index if not exists battle_rooms_public_lobby_idx
on public.battle_rooms (room_type, status, created_at desc);

create index if not exists battle_room_players_room_status_idx
on public.battle_room_players (room_id, status);

alter table public.battle_candle_cache enable row level security;
