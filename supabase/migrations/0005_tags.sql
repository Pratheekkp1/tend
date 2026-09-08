-- Tags: a reusable, named, colored label set per user. task_tags is the
-- join table assigning any subset of a user's tags to a task; it carries its
-- own user_id (duplicated from tags/tasks) so RLS policies can filter
-- directly on this table without a subquery/join, same reasoning as
-- subtasks.user_id.
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#f28482',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.task_tags (
  task_id uuid not null references public.tasks (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (task_id, tag_id)
);

create index if not exists task_tags_task_id_idx on public.task_tags (task_id);
create index if not exists task_tags_tag_id_idx on public.task_tags (tag_id);

alter table public.tags enable row level security;
alter table public.task_tags enable row level security;

create policy "tags_select_own" on public.tags
  for select using (auth.uid() = user_id);
create policy "tags_insert_own" on public.tags
  for insert with check (auth.uid() = user_id);
create policy "tags_update_own" on public.tags
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tags_delete_own" on public.tags
  for delete using (auth.uid() = user_id);

create policy "task_tags_select_own" on public.task_tags
  for select using (auth.uid() = user_id);
create policy "task_tags_insert_own" on public.task_tags
  for insert with check (auth.uid() = user_id);
create policy "task_tags_delete_own" on public.task_tags
  for delete using (auth.uid() = user_id);
