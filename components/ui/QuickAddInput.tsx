import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { TimePickerButton } from "./TimePickerButton";
import { cyclePriority, detectPriorityFromTitle, PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/priority";
import { cycleRecurrence, RECURRENCE_SHORT_LABEL } from "@/lib/recurrence";
import { detectTimeFromTitle, formatTime12h } from "@/lib/time";
import type { Priority, Recurrence } from "@/types/task";

export function QuickAddInput({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (title: string, priority: Priority, dueTime: string | null, recurrence: Recurrence) => void;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  // null = follow auto-detection from the title; once the user taps the
  // flag/clock/repeat controls, that pins an explicit choice.
  const [manualPriority, setManualPriority] = useState<Priority | null>(null);
  const [manualTime, setManualTime] = useState<string | null | undefined>(undefined);
  const [recurrence, setRecurrence] = useState<Recurrence>("none");

  const autoDetectedPriority = useMemo(() => detectPriorityFromTitle(value), [value]);
  const priority: Priority = manualPriority ?? autoDetectedPriority ?? "none";
  const isPriorityAutoSuggested = manualPriority === null && autoDetectedPriority !== null;

  const timeDetection = useMemo(() => detectTimeFromTitle(value), [value]);
  const dueTime = manualTime !== undefined ? manualTime : timeDetection?.time ?? null;
  const isTimeAutoSuggested = manualTime === undefined && timeDetection !== null;

  const submit = () => {
    const trimmed = (isTimeAutoSuggested ? timeDetection!.cleanedTitle : value).trim();
    if (!trimmed) return;
    onSubmit(trimmed, priority, dueTime, recurrence);
    setValue("");
    setManualPriority(null);
    setManualTime(undefined);
    setRecurrence("none");
  };

  return (
    <View className="gap-1.5">
      <View
        className={`flex-row items-center rounded-xl bg-white/70 dark:bg-white/10 border px-3 ${
          focused ? "border-accent-400" : "border-accent-900/5 dark:border-white/5"
        }`}
      >
        <Ionicons name="add" size={20} color="#c98a9c" />
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text);
            if (manualPriority === "none" && detectPriorityFromTitle(text) === null) {
              setManualPriority(null);
            }
          }}
          placeholder={placeholder}
          placeholderTextColor="#c9a0ad"
          onSubmitEditing={submit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="done"
          className="flex-1 px-2 py-3 text-base text-ink-light dark:text-ink-dark"
          style={{ outlineStyle: "none", outlineWidth: 0 } as never}
        />
        <Pressable
          onPress={() => setRecurrence(cycleRecurrence(recurrence))}
          hitSlop={8}
          className="p-1.5"
          accessibilityLabel="Repeat"
        >
          <Ionicons
            name={recurrence === "none" ? "repeat-outline" : "repeat"}
            size={18}
            color={recurrence === "none" ? "#c9a0ad" : "#84a59d"}
          />
        </Pressable>
        <TimePickerButton value={dueTime} onChange={setManualTime} />
        <Pressable
          onPress={() => setManualPriority(cyclePriority(priority))}
          hitSlop={8}
          className="p-1.5"
          accessibilityLabel={PRIORITY_LABEL[priority]}
        >
          <Ionicons
            name={priority === "none" ? "flag-outline" : "flag"}
            size={18}
            color={priority === "none" ? "#c9a0ad" : PRIORITY_COLOR[priority]}
          />
        </Pressable>
        {value.length > 0 && (
          <Pressable
            onPress={submit}
            className="rounded-lg bg-accent-500 px-3 py-1.5 active:bg-accent-600"
          >
            <Ionicons name="arrow-up" size={16} color="white" />
          </Pressable>
        )}
      </View>

      {(priority !== "none" || dueTime || recurrence !== "none") && (
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 px-1">
          {priority !== "none" && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="flag" size={12} color={PRIORITY_COLOR[priority]} />
              <Text className="text-xs" style={{ color: PRIORITY_COLOR[priority] }}>
                {isPriorityAutoSuggested ? `${PRIORITY_LABEL[priority]} detected` : PRIORITY_LABEL[priority]}
              </Text>
              <Pressable onPress={() => setManualPriority("none")} hitSlop={6}>
                <Text className="text-xs text-ink-light/40 dark:text-ink-dark/40 underline">clear</Text>
              </Pressable>
            </View>
          )}
          {dueTime && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="time" size={12} color="#c99135" />
              <Text className="text-xs text-gold-700">
                {formatTime12h(dueTime)}
                {isTimeAutoSuggested ? " detected" : ""}
              </Text>
              <Pressable onPress={() => setManualTime(null)} hitSlop={6}>
                <Text className="text-xs text-ink-light/40 dark:text-ink-dark/40 underline">clear</Text>
              </Pressable>
            </View>
          )}
          {recurrence !== "none" && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="repeat" size={12} color="#5f7d76" />
              <Text className="text-xs text-sage-700">{RECURRENCE_SHORT_LABEL[recurrence]}</Text>
              <Pressable onPress={() => setRecurrence("none")} hitSlop={6}>
                <Text className="text-xs text-ink-light/40 dark:text-ink-dark/40 underline">clear</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
