import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

/** Signs the user in via Supabase's managed Google OAuth. Web redirects the
 * whole page; native opens a system auth session and hands the returned
 * tokens to the Supabase client directly. This is identity-only (no
 * Calendar scope) -- Calendar access is a separate opt-in from Settings. */
export async function signInWithGoogle() {
  const redirectTo = AuthSession.makeRedirectUri({ scheme: "productivityapp" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== "web",
    },
  });
  if (error) throw error;
  if (Platform.OS === "web") return;

  const result = await WebBrowser.openAuthSessionAsync(data.url!, redirectTo);
  if (result.type !== "success" || !result.url) {
    throw new Error("Sign-in was cancelled");
  }

  const fragment = result.url.split("#")[1] ?? "";
  const params = new URLSearchParams(fragment);
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) {
    throw new Error("Sign-in did not return a session");
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (sessionError) throw sessionError;
}
