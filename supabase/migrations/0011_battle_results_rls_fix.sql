create or replace function public.is_battle_room_participant(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.battle_room_players
    where public.battle_room_players.room_id = target_room_id
      and public.battle_room_players.user_id = auth.uid()
  );
$$;

revoke all on function public.is_battle_room_participant(uuid) from public;
grant execute on function public.is_battle_room_participant(uuid) to authenticated;

drop policy if exists "Battle participants can read their rooms" on public.battle_rooms;
create policy "Battle participants can read their rooms"
on public.battle_rooms
for select
using (public.is_battle_room_participant(id));

drop policy if exists "Battle participants can read room players" on public.battle_room_players;
create policy "Battle participants can read room players"
on public.battle_room_players
for select
using (public.is_battle_room_participant(room_id));

drop policy if exists "Battle participants can read results" on public.battle_results;
create policy "Battle participants can read results"
on public.battle_results
for select
using (public.is_battle_room_participant(room_id));
