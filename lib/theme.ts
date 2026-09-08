import AsyncStorage from "@react-native-async-storage/async-storage";
import { colorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { Appearance, Platform } from "react-native";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme-preference";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function resolveSystemScheme(): "light" | "dark" {
  if (Platform.OS === "web") {
    return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

let stopTrackingSystem: (() => void) | null = null;

/** nativewind 4.2.6's colorScheme.set("system") on web unconditionally
 * removes the "dark" DOM class instead of resolving it against the actual OS
 * preference -- so on a system-dark browser, Tailwind's `dark:` classes stay
 * off while components reading the colorScheme hook directly (which DOES
 * fall back to the system observable) still compute "dark", producing a
 * visibly broken split (e.g. a light sidebar over a dark page background).
 * Resolve "system" ourselves and keep it live-synced instead of delegating
 * that resolution to colorScheme.set. */
function applyPreference(pref: ThemePreference) {
  stopTrackingSystem?.();
  stopTrackingSystem = null;

  if (pref !== "system") {
    colorScheme.set(pref);
    return;
  }

  colorScheme.set(resolveSystemScheme());

  if (Platform.OS === "web") {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => colorScheme.set(resolveSystemScheme());
    mql.addEventListener("change", handler);
    stopTrackingSystem = () => mql.removeEventListener("change", handler);
  } else {
    const sub = Appearance.addChangeListener(() => colorScheme.set(resolveSystemScheme()));
    stopTrackingSystem = () => sub.remove();
  }
}

/** Applies the user's saved theme preference; call once at app startup. */
export async function hydrateThemePreference() {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  applyPreference(isThemePreference(stored) ? stored : "system");
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
    applyPreference(value);
    AsyncStorage.setItem(STORAGE_KEY, value);
  };

  return { preference, setPreference };
}
