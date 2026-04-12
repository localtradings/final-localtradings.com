alter table public.battle_rooms
drop constraint if exists battle_rooms_room_type_check;

alter table public.battle_rooms
add constraint battle_rooms_room_type_check
check (room_type in ('public', 'private', 'open'));

alter table public.battle_rooms
drop constraint if exists battle_rooms_duration_minutes_check;

alter table public.battle_rooms
add constraint battle_rooms_duration_minutes_check
check (duration_minutes in (10, 15, 30, 45, 60));

alter table public.battle_rooms
drop constraint if exists battle_rooms_max_players_check;

alter table public.battle_rooms
add constraint battle_rooms_max_players_check
check (max_players between 2 and 10);

alter table public.battle_rooms
add column if not exists risk_limit_percent numeric(5, 2),
add column if not exists max_drawdown_percent numeric(5, 2);

alter table public.battle_room_players
drop constraint if exists battle_room_players_status_check;

alter table public.battle_room_players
add constraint battle_room_players_status_check
check (
  status in (
    'joined',
    'ready',
    'removed_unready',
    'active',
    'finished',
    'left_lobby',
    'left_early',
    'forfeit',
    'no_trade',
    'drawdown_limit'
  )
);

alter table public.battle_results
drop constraint if exists battle_results_room_type_check;

alter table public.battle_results
add constraint battle_results_room_type_check
check (room_type in ('public', 'private', 'open'));

alter table public.battle_results
drop constraint if exists battle_results_duration_minutes_check;

alter table public.battle_results
add constraint battle_results_duration_minutes_check
check (duration_minutes in (10, 15, 30, 45, 60));

alter table public.battle_results
add column if not exists risk_limit_percent numeric(5, 2),
add column if not exists max_drawdown_percent numeric(5, 2);
