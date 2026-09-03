import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { ConfigNotice } from "@/components/ConfigNotice";
import { useAuth } from "@/lib/auth-context";
import { isSupabaseConfigured } from "@/lib/env";

export default function Index() {
  const { session, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <ConfigNotice
        title="Connect Supabase to get started"
        body="Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, then reload. See SETUP.md for step-by-step instructions."
      />
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#f28482" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(tabs)/today" />;
}
