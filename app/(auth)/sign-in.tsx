import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { signInWithGoogle } from "@/lib/googleSignIn";

export default function SignIn() {
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (session) return <Redirect href="/(tabs)/today" />;

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center gap-8 px-8">
      <View className="items-center gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-accent-500">
          <Ionicons name="flower" size={28} color="white" />
        </View>
        <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">Productivity</Text>
        <Text className="text-center text-sm text-ink-light/60 dark:text-ink-dark/60 max-w-xs">
          Your calendar and to-dos, in sync everywhere.
        </Text>
      </View>

      <View className="w-full max-w-xs gap-3">
        <Button
          label={signingIn ? "Signing in…" : "Continue with Google"}
          onPress={handleSignIn}
          disabled={signingIn}
        />
        {error ? (
          <Text className="text-center text-sm text-red-500">{error}</Text>
        ) : null}
      </View>
    </View>
  );
}
