import { handleOptions, json } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/google.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const userId = await getUserId(req);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const admin = getAdminClient();
  const { data } = await admin
    .from("google_calendar_tokens")
    .select("calendar_id")
    .eq("user_id", userId)
    .maybeSingle();

  return json({ connected: Boolean(data), calendarId: data?.calendar_id ?? null });
});
