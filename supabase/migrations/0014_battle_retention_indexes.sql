create index if not exists battle_candle_cache_expires_at_idx
on public.battle_candle_cache (expires_at);

create index if not exists battle_rooms_status_updated_at_idx
on public.battle_rooms (status, updated_at);

create index if not exists battle_rooms_status_ended_at_idx
on public.battle_rooms (status, ended_at);

create index if not exists battle_penalties_ends_at_idx
on public.battle_penalties (ends_at);
 