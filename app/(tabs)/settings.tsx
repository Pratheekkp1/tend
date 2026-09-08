import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/lib/auth-context";
import { isGoogleConfigured } from "@/lib/env";
import { upgradeGuestToEmailAccount } from "@/lib/emailAuth";
import {
  useConnectGoogleCalendar,
  useDisconnectGoogleCalendar,
  useGoogleCalendarStatus,
} from "@/lib/googleCalendar";
import { useThemePreference, type ThemePreference } from "@/lib/theme";

const THEME_OPTIONS: { key: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "light", label: "Light", icon: "sunny-outline" },
  { key: "dark", label: "Dark", icon: "moon-outline" },
  { key: "system", label: "System", icon: "phone-portrait-outline" },
];

function AppearanceCard() {
  const { preference, setPreference } = useThemePreference();

  return (
    <View className="rounded-2xl bg-white/70 dark:bg-surface-dark-subtle/70 border border-accent-900/5 dark:border-white/5 p-4 mb-4">
      <Text className="text-xs font-semibold uppercase tracking-wide text-ink-light/45 dark:text-ink-dark/45 mb-3">
        Appearance
      </Text>
      <View className="flex-row rounded-xl bg-surface-subtle dark:bg-white/[0.06] p-1 gap-1">
        {THEME_OPTIONS.map((opt) => {
          const active = preference === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setPreference(opt.key)}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-lg py-2 ${
                active ? "bg-accent-500" : ""
              }`}
            >
              <Ionicons name={opt.icon} size={14} color={active ? "white" : "#c9a08f"} />
              <Text className={`text-xs font-medium ${active ? "text-white" : "text-ink-light/60 dark:text-ink-dark/60"}`}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function GuestUpgradeCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await upgradeGuestToEmailAccount(email, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your account");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <View className="rounded-2xl bg-accent-500/10 border border-accent-500/20 p-4 mb-4">
        <Text className="text-sm text-ink-light dark:text-ink-dark">
          Check your email to confirm — your tasks are already saved to this account.
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-2xl bg-accent-500/10 border border-accent-500/20 p-4 mb-4 gap-3">
      <View>
        <Text className="text-sm font-semibold text-ink-light dark:text-ink-dark mb-1">
          You're using guest mode
        </Text>
        <Text className="text-xs text-ink-light/60 dark:text-ink-dark/60">
          Your tasks only live on this device right now. Add an email and password to keep them
          safe and sync across devices — nothing you've made gets lost.
        </Text>
      </View>
      <TextField
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        textContentType="newPassword"
      />
      <Button
        label={busy ? "Saving…" : "Save my account"}
        onPress={submit}
        disabled={busy || !email || !password}
      />
      {error ? <Text className="text-sm text-red-500">{error}</Text> : null}
    </View>
  );
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { data: status, isLoading } = useGoogleCalendarStatus();
  const { connect, ready, response, isExchanging, exchange } = useConnectGoogleCalendar();
  const disconnect = useDisconnectGoogleCalendar();
  const [error, setError] = useState<string | null>(null);
  const isGuest = Boolean(session?.user.is_anonymous);

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

      {isGuest && <GuestUpgradeCard />}

      <AppearanceCard />

      <View className="rounded-2xl bg-white/70 dark:bg-surface-dark-subtle/70 border border-accent-900/5 dark:border-white/5 p-4 mb-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-ink-light/45 dark:text-ink-dark/45 mb-2">
          Account
        </Text>
        <Text className="text-base text-ink-light dark:text-ink-dark mb-4">
          {isGuest ? "Guest" : session?.user.email}
        </Text>
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
              <Ionicons name="checkmark-circle" size={18} color="#84a59d" />
              <Text className="text-sm text-ink-light dark:text-ink-dark">Connected</Text>
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
