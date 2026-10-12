# tend 🌱

**A calm, cross-platform calendar and to-do app that keeps your tasks and your Google Calendar in one timeline.**

Built with Expo and React Native, so one TypeScript codebase runs on iOS and the web. Supabase handles auth and data, and Google Calendar sync goes through server-side Edge Functions.

## Features

- **Today, To-dos, Calendar and Settings tabs.** The day agenda merges your tasks with Google Calendar events on a single timeline.
- **Tasks done properly:** priorities (with automatic suggestions for titles like "exam", "deadline" or "interview"), due times and durations, recurring tasks (daily, weekly, biweekly, monthly), subtasks and tags.
- **Gestures:** swipe a row to complete or delete it, with an undo toast.
- **Local reminders** via Expo Notifications.
- **Search** across all tasks.
- **Sign in with email or Google.**

## Architecture

```
Expo app (iOS / web)                         Supabase
┌─────────────────────────────┐      ┌───────────────────────────────────────┐
│ expo-router screens         │      │ Postgres + Row-Level Security         │
│ TanStack Query data hooks ──┼──────►   tasks, subtasks, tags, task_tags    │
│ Supabase Auth (email/Google)│      │                                       │
│                             │      │ Edge Functions (Deno)                 │
│ "Link Google Calendar" ─────┼──────►   google-oauth-exchange               │
│                             │      │   google-calendar-events / status /   │
│                             │      │   disconnect                          │
└─────────────────────────────┘      │   google_calendar_tokens (server-only)│
                                     └──────────────────┬────────────────────┘
                                                        ▼
                                              Google Calendar API
```

**Design decisions**
- **Calendar OAuth tokens never touch the device.** The app sends only the auth code; an Edge Function exchanges it and stores and refreshes the tokens server-side.
- **Row-Level Security** on every table, so each user can only read and write their own rows, enforced by the database.
- **Versioned SQL migrations** in `supabase/migrations/`.
- Server state lives in **TanStack Query** caches; domain logic (recurrence, priority sorting, overdue detection) is in plain, testable TypeScript modules under `lib/`.

## Tech stack

TypeScript · React Native 0.86 · Expo SDK 57 · expo-router · TanStack Query · NativeWind (Tailwind) · Reanimated · Supabase (Postgres, Auth, Edge Functions) · Google Calendar API · date-fns

## Project structure

```
app/                 expo-router routes: (auth)/sign-in, (tabs)/today|todos|calendar|settings
components/          CalendarTimeline, DayAgenda, TaskList, TaskItem, TaskDetailModal, ...
lib/                 data hooks + domain logic (tasks, recurrence, priority, tags, googleCalendar, ...)
supabase/
  migrations/        schema + RLS policies
  functions/         Edge Functions for Google OAuth and Calendar proxying
```

## Running locally

```bash
npm install
cp .env.example .env     # add Supabase URL + anon key (and Google client IDs for Calendar)
npx expo start           # press i for iOS simulator, w for web
```

The app runs with zero configuration and shows setup prompts. For full sign-in and Calendar sync, follow **[SETUP.md](SETUP.md)** to create the Supabase project and Google OAuth clients.
