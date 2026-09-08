import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";
import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

/** Applies the user's saved theme preference; call once at app startup. */
export async function hydrateThemePreference() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (isThemePreference(stored)) colorScheme.set(stored);
}

/** Settings-screen hook: tracks which of Light/Dark/System is active and persists changes. */
export function useThemePreference() {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isThemePreference(stored)) setPreferenceState(stored);
    });
  }, []);

  const setPreference = (value: ThemePreference) => {
    setPreferenceState(value);
    colorScheme.set(value);
    AsyncStorage.setItem(STORAGE_KEY, value);
  };

  return { preference, setPreference };
}
