import type { ReactNode } from "react";
import { useColorScheme, View } from "react-native";

const LIGHT_BG = "#f7ede2";
const DARK_BG = "#241f1c";

/** Flat, calm backdrop mounted once behind every route. Deliberately plain. */
export function AppBackground({ children }: { children: ReactNode }) {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? DARK_BG : LIGHT_BG }}>{children}</View>
  );
}
