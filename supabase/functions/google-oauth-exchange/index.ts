import { handleOptions, json } from "../_shared/cors.ts";
import { exchangeCodeForTokens, getAdminClient, getUserId } from "../_shared/google.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const userId = await getUserId(req);
  if (!userId) return json({ error: "Unauthorized" }, 401);

  try {
    const { code, codeVerifier, redirectUri, clientType } = await req.json();
    if (!code || !codeVerifier || !redirectUri || !clientType) {
      return json({ error: "Missing code, codeVerifier, redirectUri, or clientType" }, 400);
    }

    const tokens = await exchangeCodeForTokens({ code, codeVerifier, redirectUri, clientType });
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const admin = getAdminClient();
    const { error } = await admin.from("google_calendar_tokens").upsert({
      user_id: userId,
      client_type: clientType,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      calendar_id: "primary",
    });
    if (error) throw error;

    return json({ connected: true });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
