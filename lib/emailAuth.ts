import { supabase } from "./supabase";

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  // With email confirmation enabled (Supabase's default), there's no session yet.
  return { needsEmailConfirmation: !data.session };
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/** Starts using the app with no account at all -- a real (but anonymous) Supabase
 * user, so all the normal sync/RLS machinery just works. Requires "Allow anonymous
 * sign-ins" to be enabled in the Supabase dashboard. */
export async function continueAsGuest() {
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

/** Turns a guest session into a real account without losing any of its data --
 * same user id, so all their existing tasks stay attached. */
export async function upgradeGuestToEmailAccount(email: string, password: string) {
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) throw error;
}
