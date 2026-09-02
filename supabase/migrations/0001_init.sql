-- Tasks: both the general/backlog list and day-specific todos live in one
-- table. due_date IS NULL means it belongs to the general list.
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  notes text,
  due_date date,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_due_date_idx on public.tasks (user_id, due_date);
create index if not exists tasks_user_position_idx on public.tasks (user_id, position);

alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Google Calendar OAuth tokens, stored server-side only. The client never
-- reads this table directly (no select policy) -- only Edge Functions using
-- the service role key touch it, so the refresh token never reaches a device.
create table if not exists public.google_calendar_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  client_type text not null check (client_type in ('ios', 'web')),
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  calendar_id text not null default 'primary',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_calendar_tokens enable row level security;

create trigger google_calendar_tokens_set_updated_at
  before update on public.google_calendar_tokens
  for each row execute function public.set_updated_at();

-- Realtime: let clients subscribe to their own task changes for live sync.
alter publication supabase_realtime add table public.tasks;
