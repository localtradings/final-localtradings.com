alter table public.profiles
add column if not exists is_pro boolean not null default false;

create table if not exists public.battle_rooms (
  id uuid primary key,
  creator_user_id uuid references auth.users (id) on delete set null,
  room_type text not null check (room_type in ('public', 'private')),
  status text not null check (status in ('lobby', 'active', 'finished', 'cancelled')),
  duration_minutes integer not null check (duration_minutes in (10, 15, 30, 45)),
  symbol text,
  timeframe text,
  lobby_code text unique,
  max_players integer not null default 5 check (max_players between 2 and 5),
  countdown_ends_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  winner_user_id uuid references auth.users (id) on delete set null,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.battle_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.battle_rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  is_creator boolean not null default false,
  status text not null check (
    status in (
      'joined',
      'ready',
      'removed_unready',
      'active',
      'finished',
      'left_lobby',
      'left_early',
      'forfeit',
      'no_trade'
    )
  ),
  joined_at timestamptz not null default now(),
  ready_at timestamptz,
  removed_at timestamptz,
  last_heartbeat_at timestamptz,
  disconnected_at timestamptz,
  official_balance numeric(14, 2) not null default 100000,
  official_rank integer not null default 1,
  trades_closed integer not null default 0,
  winning_trades integer not null default 0,
  losing_trades integer not null default 0,
  has_open_trade boolean not null default false,
  unique (room_id, user_id)
);

create table if not exists public.battle_results (
  room_id uuid primary key references public.battle_rooms (id) on delete cascade,
  room_type text not null check (room_type in ('public', 'private')),
  duration_minutes integer not null check (duration_minutes in (10, 15, 30, 45)),
  symbol text not null,
  timeframe text not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  winner_user_id uuid references auth.users (id) on delete set null,
  winner_display_name text,
  entries jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.battle_penalties (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references public.battle_rooms (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('left_early', 'forfeit', 'no_trade')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists battle_rooms_status_idx
on public.battle_rooms (status, created_at desc);

create index if not exists battle_rooms_lobby_code_idx
on public.battle_rooms (lobby_code);

create index if not exists battle_room_players_room_idx
on public.battle_room_players (room_id);

create index if not exists battle_room_players_user_idx
on public.battle_room_players (user_id, joined_at desc);

create index if not exists battle_penalties_user_idx
on public.battle_penalties (user_id, ends_at desc);

alter table public.battle_rooms enable row level security;
alter table public.battle_room_players enable row level security;
alter table public.battle_results enable row level security;
alter table public.battle_penalties enable row level security;

create policy "Battle participants can read their rooms"
on public.battle_rooms
for select
using (
  exists (
    select 1
    from public.battle_room_players
    where public.battle_room_players.room_id = public.battle_rooms.id
      and public.battle_room_players.user_id = auth.uid()
  )
);

create policy "Battle participants can read room players"
on public.battle_room_players
for select
using (
  exists (
    select 1
    from public.battle_room_players as membership
    where membership.room_id = public.battle_room_players.room_id
      and membership.user_id = auth.uid()
  )
);

create policy "Battle participants can read results"
on public.battle_results
for select
using (
  exists (
    select 1
    from public.battle_room_players
    where public.battle_room_players.room_id = public.battle_results.room_id
      and public.battle_room_players.user_id = auth.uid()
  )
);

create policy "Users can read their own battle penalties"
on public.battle_penalties
for select
using (auth.uid() = user_id);
