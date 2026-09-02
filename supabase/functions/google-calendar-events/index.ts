import { handleOptions, json } from "../_shared/cors.ts";
import { getAdminClient, getUserId, getValidAccessToken } from "../_shared/google.ts";

interface GoogleApiEvent {
  id: string;
  summary?: string;
  htmlLink?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
}

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const userId = await getUserId(req);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const url = new URL(req.url);
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (!start || !end) return json({ error: "Missing start or end date" }, 400);

  const admin = getAdminClient();
  const token = await getValidAccessToken(admin, userId);
  if (!token) return json({ error: "Google Calendar not connected" }, 404);

  const eventsUrl = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(token.calendar_id)}/events`
  );
  eventsUrl.searchParams.set("timeMin", new Date(`${start}T00:00:00Z`).toISOString());
  eventsUrl.searchParams.set("timeMax", new Date(`${end}T23:59:59Z`).toISOString());
  eventsUrl.searchParams.set("singleEvents", "true");
  eventsUrl.searchParams.set("orderBy", "startTime");

  const res = await fetch(eventsUrl, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!res.ok) return json({ error: await res.text() }, 502);

  const data = (await res.json()) as { items: GoogleApiEvent[] };
  const events = (data.items ?? []).map((item) => ({
    id: item.id,
    title: item.summary ?? "(untitled event)",
    start: item.start.dateTime ?? item.start.date ?? "",
    end: item.end.dateTime ?? item.end.date ?? "",
    allDay: Boolean(item.start.date),
    htmlLink: item.htmlLink,
  }));

  return json(events);
});
