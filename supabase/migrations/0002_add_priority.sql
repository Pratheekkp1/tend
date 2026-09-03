-- Priority: user-settable, and optionally auto-suggested client-side from
-- keywords in the title (e.g. "test", "exam") -- the server just stores the
-- resolved value, it doesn't know or care how it was chosen.
alter table public.tasks
  add column if not exists priority text not null default 'none'
    check (priority in ('none', 'low', 'medium', 'high'));

create index if not exists tasks_user_priority_idx on public.tasks (user_id, priority);
