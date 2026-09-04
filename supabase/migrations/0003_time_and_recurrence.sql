-- Optional time-of-day for a task, plus how long it should look on a
-- timeline. Both null means "just a date, no specific time" (unchanged
-- behavior from before this migration).
alter table public.tasks
  add column if not exists due_time text,
  add column if not exists duration_minutes integer;

alter table public.tasks
  add constraint tasks_due_time_format
    check (due_time is null or due_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

alter table public.tasks
  add constraint tasks_duration_positive
    check (duration_minutes is null or duration_minutes > 0);

-- Simple recurrence: completing a recurring task creates the next
-- occurrence rather than materializing every future instance up front.
alter table public.tasks
  add column if not exists recurrence text not null default 'none'
    check (recurrence in ('none', 'daily', 'weekly', 'biweekly', 'monthly'));
