import "../global.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppBackground } from "@/components/AppBackground";
import { AuthProvider } from "@/lib/auth-context";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

// The navigator paints its own opaque theme background beneath every screen's
// content, independent of contentStyle -- override it so our gradient/petals
// show through instead of React Navigation's default #f2f2f2 / near-black.
const TransparentLight = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "transparent" } };
const TransparentDark = { ...DarkTheme, colors: { ...DarkTheme.colors, background: "transparent" } };

export default function RootLayout() {
  const isDark = useColorScheme() === "dark";

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="auto" />
            <ThemeProvider value={isDark ? TransparentDark : TransparentLight}>
              <AppBackground>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "transparent" } }} />
              </AppBackground>
            </ThemeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
