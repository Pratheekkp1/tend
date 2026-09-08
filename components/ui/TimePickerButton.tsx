import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { glassBlur } from "@/lib/glass";
import { formatTime12h } from "@/lib/time";

function parseTime(t: string | null): { h12: number; m: number; pm: boolean } {
  if (!t) {
    const now = new Date();
    const h = now.getHours();
    const pm = h >= 12;
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const m = Math.round(now.getMinutes() / 5) * 5 % 60;
    return { h12, m, pm };
  }
  const [hh, mm] = t.split(":").map(Number);
  const pm = hh >= 12;
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return { h12, m: mm, pm };
}

function toTimeString(h12: number, m: number, pm: boolean): string {
  let h = h12 % 12;
  if (pm) h += 12;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function Stepper({
  value,
  onInc,
  onDec,
}: {
  value: string;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <View className="items-center">
      <Pressable
        onPress={onInc}
        hitSlop={8}
        className="h-8 w-12 items-center justify-center rounded-t-lg bg-accent-500/10 active:bg-accent-500/20"
      >
        <Ionicons name="chevron-up" size={16} color="#f28482" />
      </Pressable>
      <View className="w-12 items-center justify-center py-2 bg-surface-subtle dark:bg-white/[0.06]">
        <Text className="text-xl font-bold tabular-nums text-ink-light dark:text-ink-dark">{value}</Text>
      </View>
      <Pressable
        onPress={onDec}
        hitSlop={8}
        className="h-8 w-12 items-center justify-center rounded-b-lg bg-accent-500/10 active:bg-accent-500/20"
      >
        <Ionicons name="chevron-down" size={16} color="#f28482" />
      </Pressable>
    </View>
  );
}

/** Clock-icon trigger + popover with hour/minute steppers, so a time can be
 * dialed in precisely instead of only cycling through fixed presets. */
export function TimePickerButton({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (time: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseTime(value));

  useEffect(() => {
    if (open) setDraft(parseTime(value));
  }, [open, value]);

  const apply = () => {
    onChange(toTimeString(draft.h12, draft.m, draft.pm));
    setOpen(false);
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={8} className="p-1.5" accessibilityLabel="Set time">
        <Ionicons name={value ? "time" : "time-outline"} size={18} color={value ? "#f6bd60" : "#c9a0ad"} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 items-center justify-center px-8"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
          onPress={() => setOpen(false)}
        >
          <View
            className="w-full max-w-xs rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 bg-surface-light dark:bg-surface-dark-subtle/90"
            style={glassBlur}
          >
            <View className="px-4 py-3 border-b border-black/5 dark:border-white/10">
              <Text className="text-center font-semibold text-ink-light dark:text-ink-dark">Set time</Text>
            </View>

            <View className="flex-row items-center justify-center gap-3 py-5">
              <Stepper
                value={String(draft.h12).padStart(2, "0")}
                onInc={() => setDraft((d) => ({ ...d, h12: (d.h12 % 12) + 1 }))}
                onDec={() => setDraft((d) => ({ ...d, h12: ((d.h12 + 10) % 12) + 1 }))}
              />
              <Text className="text-xl font-bold text-ink-light dark:text-ink-dark">:</Text>
              <Stepper
                value={String(draft.m).padStart(2, "0")}
                onInc={() => setDraft((d) => ({ ...d, m: (d.m + 5) % 60 }))}
                onDec={() => setDraft((d) => ({ ...d, m: (d.m + 55) % 60 }))}
              />
              <Pressable
                onPress={() => setDraft((d) => ({ ...d, pm: !d.pm }))}
                className="ml-1 rounded-lg px-3 py-2 bg-accent-500/10 active:bg-accent-500/20"
              >
                <Text className="font-semibold text-accent-600 dark:text-accent-300">
                  {draft.pm ? "PM" : "AM"}
                </Text>
              </Pressable>
            </View>

            <Text className="text-center text-xs text-ink-light/45 dark:text-ink-dark/45 pb-3">
              {formatTime12h(toTimeString(draft.h12, draft.m, draft.pm))}
            </Text>

            <View className="flex-row border-t border-black/5 dark:border-white/10">
              <Pressable
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="flex-1 items-center py-3 active:bg-black/5 dark:active:bg-white/5"
              >
                <Text className="text-sm font-medium text-ink-light/60 dark:text-ink-dark/60">No time</Text>
              </Pressable>
              <View className="w-px bg-black/5 dark:bg-white/10" />
              <Pressable onPress={apply} className="flex-1 items-center py-3 active:bg-accent-500/10">
                <Text className="text-sm font-semibold text-accent-600 dark:text-accent-300">Set</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
