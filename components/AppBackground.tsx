import type { ReactNode } from "react";
import { useColorScheme } from "nativewind";
import { View } from "react-native";

const LIGHT_BG = "#ffffff";
const DARK_BG = "#0f0f11";

/** Flat, calm backdrop mounted once behind every route. Deliberately plain. */
export function AppBackground({ children }: { children: ReactNode }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? DARK_BG : LIGHT_BG }}>{children}</View>
  );
}
