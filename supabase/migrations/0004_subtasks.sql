-- Subtasks: a lightweight checklist within a task. Deleting the parent task
-- cascades to its subtasks; position lets the client offer manual reordering
-- later even though today's UI just appends to the end.
create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists subtasks_task_id_idx on public.subtasks (task_id);

alter table public.subtasks enable row level security;

create policy "subtasks_select_own" on public.subtasks
  for select using (auth.uid() = user_id);
create policy "subtasks_insert_own" on public.subtasks
  for insert with check (auth.uid() = user_id);
create policy "subtasks_update_own" on public.subtasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subtasks_delete_own" on public.subtasks
  for delete using (auth.uid() = user_id);
