import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/lib/auth-context";
import { continueAsGuest, signInWithEmail, signUpWithEmail } from "@/lib/emailAuth";
import { signInWithGoogle } from "@/lib/googleSignIn";

type Mode = "signIn" | "signUp";

export default function SignIn() {
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"google" | "email" | "guest" | null>(null);

  if (session) return <Redirect href="/(tabs)/today" />;

  const run = async (kind: typeof busy, action: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    setBusy(kind);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  const handleEmailSubmit = () =>
    run("email", async () => {
      if (mode === "signUp") {
        const { needsEmailConfirmation } = await signUpWithEmail(email, password);
        if (needsEmailConfirmation) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signIn");
        }
      } else {
        await signInWithEmail(email, password);
      }
    });

  return (
    <ScrollView contentContainerClassName="flex-grow items-center justify-center px-8 py-12">
      <View className="w-full max-w-xs gap-6">
        <View className="items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-accent-500">
            <Ionicons name="flower" size={28} color="white" />
          </View>
          <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">Productivity</Text>
          <Text className="text-center text-sm text-ink-light/60 dark:text-ink-dark/60">
            Your calendar and to-dos, in sync everywhere.
          </Text>
        </View>

        <Button
          label={busy === "google" ? "Signing in…" : "Continue with Google"}
          onPress={() => run("google", signInWithGoogle)}
          disabled={busy !== null}
        />

        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-accent-900/10 dark:bg-white/10" />
          <Text className="text-xs text-ink-light/40 dark:text-ink-dark/40">or</Text>
          <View className="h-px flex-1 bg-accent-900/10 dark:bg-white/10" />
        </View>

        <View className="gap-2.5">
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
            textContentType={mode === "signUp" ? "newPassword" : "password"}
          />
          <Button
            label={
              busy === "email"
                ? "Please wait…"
                : mode === "signUp"
                  ? "Create account"
                  : "Sign in"
            }
            variant="secondary"
            onPress={handleEmailSubmit}
            disabled={busy !== null || !email || !password}
          />
          <Pressable
            onPress={() => {
              setMode(mode === "signUp" ? "signIn" : "signUp");
              setError(null);
              setNotice(null);
            }}
          >
            <Text className="text-center text-sm text-ink-light/55 dark:text-ink-dark/55">
              {mode === "signUp" ? "Already have an account? " : "New here? "}
              <Text className="text-accent-600 dark:text-accent-300 font-medium">
                {mode === "signUp" ? "Sign in" : "Create one"}
              </Text>
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => run("guest", continueAsGuest)} disabled={busy !== null}>
          <Text className="text-center text-sm text-ink-light/45 dark:text-ink-dark/45 underline">
            {busy === "guest" ? "Setting things up…" : "Continue without an account"}
          </Text>
        </Pressable>

        {notice ? (
          <Text className="text-center text-sm text-accent-700 dark:text-accent-300">{notice}</Text>
        ) : null}
        {error ? <Text className="text-center text-sm text-red-500">{error}</Text> : null}
      </View>
    </ScrollView>
  );
}
