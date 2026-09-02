import { handleOptions, json } from "../_shared/cors.ts";
import { getAdminClient, getUserId } from "../_shared/google.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const userId = await getUserId(req);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  const admin = getAdminClient();
  const { error } = await admin.from("google_calendar_tokens").delete().eq("user_id", userId);
  if (error) return json({ error: String(error) }, 500);

  return json({ connected: false });
});
