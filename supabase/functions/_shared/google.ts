import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export interface TokenRow {
  user_id: string;
  client_type: "ios" | "web";
  access_token: string;
  refresh_token: string;
  expires_at: string;
  calendar_id: string;
}

/** Service-role client: bypasses RLS, only ever used inside Edge Functions. */
export function getAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/** Resolves the caller's user id from the Supabase JWT on the request. */
export async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace("Bearer ", "");
  if (!jwt) return null;

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user) return null;
  return data.user.id;
}

function credentialsFor(clientType: "ios" | "web") {
  if (clientType === "web") {
    return {
      client_id: Deno.env.get("GOOGLE_WEB_CLIENT_ID")!,
      client_secret: Deno.env.get("GOOGLE_WEB_CLIENT_SECRET")!,
    };
  }
  return { client_id: Deno.env.get("GOOGLE_IOS_CLIENT_ID")! };
}

export async function exchangeCodeForTokens(params: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
  clientType: "ios" | "web";
}) {
  const body = new URLSearchParams({
    ...credentialsFor(params.clientType),
    code: params.code,
    code_verifier: params.codeVerifier,
    redirect_uri: params.redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${await res.text()}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

async function refreshAccessToken(row: TokenRow) {
  const body = new URLSearchParams({
    ...credentialsFor(row.client_type),
    refresh_token: row.refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${await res.text()}`);
  }
  return (await res.json()) as { access_token: string; expires_in: number };
}

/** Returns a valid access token for the user, refreshing and persisting it if it's stale. */
export async function getValidAccessToken(
  admin: SupabaseClient,
  userId: string
): Promise<TokenRow | null> {
  const { data: row } = await admin
    .from("google_calendar_tokens")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle<TokenRow>();

  if (!row) return null;

  const expiresAt = new Date(row.expires_at).getTime();
  const isStale = expiresAt - Date.now() < 60_000;
  if (!isStale) return row;

  const refreshed = await refreshAccessToken(row);
  const nextExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

  await admin
    .from("google_calendar_tokens")
    .update({ access_token: refreshed.access_token, expires_at: nextExpiresAt })
    .eq("user_id", userId);

  return { ...row, access_token: refreshed.access_token, expires_at: nextExpiresAt };
}
