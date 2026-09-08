# Setup

The app runs and shows setup prompts with no configuration at all — but to
actually sign in, sync tasks, and link Google Calendar you need your own free
Supabase project and a Google Cloud OAuth client. Neither can be created on
your behalf (they require your own accounts), so follow these steps once.

## 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. In the dashboard, go to **SQL Editor** → paste the contents of
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) → **Run**.
   Then do the same, in order, for every other file in `supabase/migrations/`:
   [`0002_add_priority.sql`](supabase/migrations/0002_add_priority.sql) (adds `priority`),
   [`0003_time_and_recurrence.sql`](supabase/migrations/0003_time_and_recurrence.sql)
   (adds `due_time`, `duration_minutes`, `recurrence`), and
   [`0004_subtasks.sql`](supabase/migrations/0004_subtasks.sql) (adds the `subtasks` table) —
   run any new migration file added here later the same way, in filename order.
   This creates the `tasks` and `google_calendar_tokens` tables with row-level
   security so each user only ever sees their own data.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Create a `.env` file in the project root (copy `.env.example`) and paste
   those two values in.

## 2. Google sign-in (Supabase-managed)

This is what lets you tap "Continue with Google" on the sign-in screen —
separate from Calendar linking below.

1. In [Google Cloud Console](https://console.cloud.google.com), create a
   project (or reuse one), then **APIs & Services → Credentials → Create
   Credentials → OAuth client ID**, type **Web application**.
2. Under **Authorized redirect URIs**, add your Supabase project's callback
   URL: `https://<your-project-ref>.supabase.co/auth/v1/callback` (find the
   exact URL in Supabase under **Authentication → Providers → Google**).
3. Copy the generated **Client ID** and **Client secret**.
4. In Supabase, go to **Authentication → Providers → Google**, paste both in,
   and enable the provider.

## 3. Google Calendar linking (Settings screen)

This is a separate, optional OAuth flow the user triggers from Settings to
grant Calendar access. Tokens are exchanged and stored server-side (via
Supabase Edge Functions) so they never touch the device.

1. In the same Google Cloud project, enable the **Google Calendar API**
   (APIs & Services → Library → search "Google Calendar API" → Enable).
2. Configure the **OAuth consent screen** if you haven't already (External is
   fine for personal use; add your own email as a test user while the app is
   unpublished).
3. Create a second OAuth client, type **iOS**, with bundle ID
   `com.pratheek.productivityapp`. No secret is issued for this type — copy
   the **Client ID** → `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
4. Reuse (or create) a **Web application** client for the web build. Under
   **Authorized redirect URIs**, add the URL your Expo web app runs at (e.g.
   `http://localhost:8081` for local dev). Copy the **Client ID** →
   `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, and the **Client secret** for the next step.
5. Deploy the Edge Functions and set their secrets (requires the
   [Supabase CLI](https://supabase.com/docs/guides/cli)):
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase functions deploy google-oauth-exchange google-calendar-status \
     google-calendar-events google-calendar-disconnect
   supabase secrets set \
     GOOGLE_IOS_CLIENT_ID=<ios client id> \
     GOOGLE_WEB_CLIENT_ID=<web client id> \
     GOOGLE_WEB_CLIENT_SECRET=<web client secret>
   ```
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
   already available to Edge Functions automatically — no need to set them.)

## 4. Running the app

```bash
npm install
npm run web      # PC / Mac, in any browser
npm run ios      # iPhone/iPad Simulator (needs full Xcode, not just CLI tools)
npm run android  # Android emulator, if you ever want it
```

Google OAuth's custom URL scheme redirect (`productivityapp://`) needs a real
build — it won't work in Expo Go. `npm run ios` builds a native dev client
automatically the first time, which handles this correctly.

For Xcode: install it from the Mac App Store, then run
`sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` once.

## What already works with no setup

The app boots cleanly with an empty `.env` and shows a "Connect Supabase"
screen instead of crashing — useful for confirming the build itself is
healthy before wiring up accounts.
