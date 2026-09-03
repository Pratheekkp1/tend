import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { isGoogleConfigured } from "@/lib/env";
import {
  useConnectGoogleCalendar,
  useDisconnectGoogleCalendar,
  useGoogleCalendarStatus,
} from "@/lib/googleCalendar";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { data: status, isLoading } = useGoogleCalendarStatus();
  const { connect, ready, response, isExchanging, exchange } = useConnectGoogleCalendar();
  const disconnect = useDisconnectGoogleCalendar();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (response?.type === "success") {
      exchange.mutate(undefined, { onError: (e) => setError(String(e)) });
    } else if (response?.type === "error") {
      setError(response.error?.message ?? "Google sign-in failed");
    }
  }, [response]);

  return (
    <ScrollView style={{ paddingTop: insets.top }} contentContainerClassName="px-5 pb-8" className="flex-1">
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark pt-4 mb-6">Settings</Text>

      <View className="rounded-2xl bg-white/70 dark:bg-surface-dark-subtle/70 border border-accent-900/5 dark:border-white/5 p-4 mb-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-ink-light/45 dark:text-ink-dark/45 mb-2">
          Account
        </Text>
        <Text className="text-base text-ink-light dark:text-ink-dark mb-4">{session?.user.email}</Text>
        <Button label="Sign out" variant="secondary" onPress={() => signOut()} />
      </View>

      <View className="rounded-2xl bg-white/70 dark:bg-surface-dark-subtle/70 border border-accent-900/5 dark:border-white/5 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-ink-light/45 dark:text-ink-dark/45 mb-2">
          Google Calendar
        </Text>

        {!isGoogleConfigured ? (
          <Text className="text-sm text-ink-light/55 dark:text-ink-dark/55">
            Not configured yet — add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
            to your .env, and Google credentials to your Supabase Edge Function secrets. See SETUP.md.
          </Text>
        ) : isLoading ? (
          <ActivityIndicator size="small" />
        ) : status?.connected ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text className="text-sm text-gray-700 dark:text-gray-200">Connected</Text>
            </View>
            <Button
              label="Disconnect"
              variant="danger"
              onPress={() => disconnect.mutate()}
              disabled={disconnect.isPending}
            />
          </View>
        ) : (
          <View className="gap-3">
            <Text className="text-sm text-ink-light/55 dark:text-ink-dark/55">
              Link your Google Calendar to see events alongside your tasks.
            </Text>
            <Button
              label={isExchanging ? "Connecting…" : "Connect Google Calendar"}
              onPress={() => connect()}
              disabled={!ready || isExchanging}
            />
            {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
