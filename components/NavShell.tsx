import { Ionicons } from "@expo/vector-icons";
import { Link, usePathname } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WIDE_BREAKPOINT = 768;
const ACCENT = "#f28482";
const INACTIVE = "#c9a08f";

const NAV_ITEMS = [
  { href: "/(tabs)/today", label: "Today", icon: "sunny-outline", activeIcon: "sunny" },
  { href: "/(tabs)/calendar", label: "Calendar", icon: "calendar-outline", activeIcon: "calendar" },
  { href: "/(tabs)/todos", label: "Todos", icon: "list-outline", activeIcon: "list" },
  { href: "/(tabs)/settings", label: "Settings", icon: "settings-outline", activeIcon: "settings" },
] as const;

export function NavShell({ children }: { children: ReactNode }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isWide = width >= WIDE_BREAKPOINT;

  if (isWide) {
    return (
      <View className="flex-1 flex-row">
        <View
          style={{ paddingTop: insets.top + 24, width: 240 }}
          className="border-r border-accent-900/10 dark:border-white/10 bg-white/40 dark:bg-black/10 px-4"
        >
          <Text className="px-2 mb-8 text-lg font-bold text-ink-light dark:text-ink-dark">
            Productivity
          </Text>
          <View className="gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href.replace("/(tabs)", ""));
              return (
                <Link key={item.href} href={item.href as never} asChild>
                  <Pressable
                    className={`flex-row items-center gap-3 rounded-xl px-3 py-2.5 ${
                      active ? "bg-accent-500/15" : "active:bg-accent-500/5"
                    }`}
                  >
                    <Ionicons
                      name={(active ? item.activeIcon : item.icon) as never}
                      size={20}
                      color={active ? ACCENT : INACTIVE}
                    />
                    <Text
                      className={`text-[15px] font-medium ${
                        active ? "text-accent-600 dark:text-accent-300" : "text-ink-light/70 dark:text-ink-dark/70"
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>
        <View className="flex-1">{children}</View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <View className="flex-1">{children}</View>
      <View
        style={{ paddingBottom: insets.bottom || 8 }}
        className="flex-row border-t border-accent-900/10 dark:border-white/10 bg-white/40 dark:bg-black/10"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href.replace("/(tabs)", ""));
          return (
            <Link key={item.href} href={item.href as never} asChild>
              <Pressable className="flex-1 items-center gap-1 pt-2.5 pb-1">
                <Ionicons
                  name={(active ? item.activeIcon : item.icon) as never}
                  size={22}
                  color={active ? ACCENT : INACTIVE}
                />
                <Text
                  className={`text-[11px] font-medium ${
                    active ? "text-accent-600 dark:text-accent-300" : "text-ink-light/60 dark:text-ink-dark/50"
                  }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}
