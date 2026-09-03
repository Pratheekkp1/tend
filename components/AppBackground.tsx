import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { useColorScheme, View } from "react-native";
import { CherryBlossomBackground } from "./CherryBlossomBackground";

const LIGHT_GRADIENT = ["#fffaf8", "#fdf0f2", "#fbe3ea"] as const;
const DARK_GRADIENT = ["#1c1420", "#22182a", "#1a1420"] as const;

/** Global backdrop: soft gradient wash + drifting petals, mounted once behind all routes. */
export function AppBackground({ children }: { children: ReactNode }) {
  const isDark = useColorScheme() === "dark";

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={isDark ? DARK_GRADIENT : LIGHT_GRADIENT}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <CherryBlossomBackground />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
