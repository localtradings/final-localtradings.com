delete from public.battle_candle_cache
where provider = 'finnhub';

alter table public.battle_candle_cache
alter column provider set default 'twelve_data';
