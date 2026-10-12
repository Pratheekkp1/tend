import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Platform } from "react-native";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID, isGoogleConfigured } from "./env";
import { supabase } from "./supabase";
import type { GoogleCalendarEvent } from "@/types/task";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
];

/** Kicks off the Google consent screen; the resulting code is exchanged for
 * tokens server-side (Edge Function) so the refresh token never touches the client. */
export function useGoogleAuthRequest() {
  const clientType: "ios" | "web" = Platform.OS === "web" ? "web" : "ios";
  const clientId = clientType === "web" ? GOOGLE_WEB_CLIENT_ID : GOOGLE_IOS_CLIENT_ID;
  // `native` (not `scheme`) is required in a bare/dev-client build: `scheme`
  // alone still resolves via the runtime app-config manifest, which only
  // exists under Expo Go/EAS Update -- it throws here since this build has
  // none. `native` bypasses that lookup and takes precedence outright.
  const redirectUri = AuthSession.makeRedirectUri({ native: "productivityapp://" });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      scopes: SCOPES,
      redirectUri,
      usePKCE: true,
      extraParams: { access_type: "offline", prompt: "consent" },
    },
    discovery
  );

  return { request, response, promptAsync, redirectUri, clientType };
}

export function useConnectGoogleCalendar() {
  const queryClient = useQueryClient();
  const { request, response, promptAsync, redirectUri, clientType } = useGoogleAuthRequest();

  const exchange = useMutation({
    mutationFn: async () => {
      if (response?.type !== "success") throw new Error("Google sign-in was cancelled");
      const { error } = await supabase.functions.invoke("google-oauth-exchange", {
        body: {
          code: response.params.code,
          codeVerifier: request?.codeVerifier,
          redirectUri,
          clientType,
        },
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] }),
  });

  return {
    connect: promptAsync,
    ready: Boolean(request) && isGoogleConfigured,
    response,
    isExchanging: exchange.isPending,
    exchange,
  };
}

export function useGoogleCalendarStatus() {
  return useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ connected: boolean }>(
        "google-calendar-status"
      );
      if (error) throw error;
      return data ?? { connected: false };
    },
    enabled: isGoogleConfigured,
    retry: false,
  });
}

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("google-calendar-disconnect");
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] }),
  });
}

export function useGoogleCalendarEvents(startDate: string, endDate: string, enabled: boolean) {
  return useQuery({
    queryKey: ["google-calendar-events", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<GoogleCalendarEvent[]>(
        `google-calendar-events?start=${startDate}&end=${endDate}`
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: enabled && isGoogleConfigured,
    retry: false,
  });
}
