create table if not exists public.learn_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_slug text not null,
  lesson_slug text not null,
  status text not null check (status in ('in_progress', 'completed')),
  started_at timestamptz not null,
  updated_at timestamptz not null,
  completed_at timestamptz,
  unique (user_id, module_slug, lesson_slug)
);

create index if not exists learn_lesson_progress_user_updated_idx
on public.learn_lesson_progress (user_id, updated_at desc);

create index if not exists learn_lesson_progress_user_status_idx
on public.learn_lesson_progress (user_id, status);

alter table public.learn_lesson_progress enable row level security;

create policy "Users can read their own learn lesson progress"
on public.learn_lesson_progress
for select
using (auth.uid() = user_id);

create policy "Users can insert their own learn lesson progress"
on public.learn_lesson_progress
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own learn lesson progress"
on public.learn_lesson_progress
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own learn lesson progress"
on public.learn_lesson_progress
for delete
using (auth.uid() = user_id);
