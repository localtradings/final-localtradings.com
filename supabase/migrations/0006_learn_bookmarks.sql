create table if not exists public.learn_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('module', 'lesson')),
  module_slug text not null,
  lesson_slug text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (
    (item_type = 'module' and lesson_slug = '')
    or
    (item_type = 'lesson' and lesson_slug <> '')
  ),
  unique (user_id, item_type, module_slug, lesson_slug)
);

create index if not exists learn_bookmarks_user_updated_idx
on public.learn_bookmarks (user_id, updated_at desc);

create index if not exists learn_bookmarks_user_item_idx
on public.learn_bookmarks (user_id, item_type);

alter table public.learn_bookmarks enable row level security;

create policy "Users can read their own learn bookmarks"
on public.learn_bookmarks
for select
using (auth.uid() = user_id);

create policy "Users can insert their own learn bookmarks"
on public.learn_bookmarks
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own learn bookmarks"
on public.learn_bookmarks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own learn bookmarks"
on public.learn_bookmarks
for delete
using (auth.uid() = user_id);
