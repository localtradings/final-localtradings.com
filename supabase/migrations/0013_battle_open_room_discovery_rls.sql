create or replace function public.is_discoverable_open_battle_room(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.battle_rooms
    where public.battle_rooms.id = target_room_id
      and public.battle_rooms.room_type = 'open'
      and public.battle_rooms.status = 'lobby'
  );
$$;

revoke all on function public.is_discoverable_open_battle_room(uuid) from public;
grant execute on function public.is_discoverable_open_battle_room(uuid) to authenticated;

drop policy if exists "Authenticated users can discover open battle rooms" on public.battle_rooms;
create policy "Authenticated users can discover open battle rooms"
on public.battle_rooms
for select
to authenticated
using (room_type = 'open' and status = 'lobby');

drop policy if exists "Authenticated users can read discoverable open room players" on public.battle_room_players;
create policy "Authenticated users can read discoverable open room players"
on public.battle_room_players
for select
to authenticated
using (public.is_discoverable_open_battle_room(room_id));
