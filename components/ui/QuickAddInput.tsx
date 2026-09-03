import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { cyclePriority, detectPriorityFromTitle, PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/priority";
import type { Priority } from "@/types/task";

export function QuickAddInput({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (title: string, priority: Priority) => void;
}) {
  const [value, setValue] = useState("");
  // null = follow keyword auto-detection; once the user taps the flag, this
  // pins an explicit choice so further typing can't silently override it.
  const [manualPriority, setManualPriority] = useState<Priority | null>(null);

  const autoDetected = useMemo(() => detectPriorityFromTitle(value), [value]);
  const priority: Priority = manualPriority ?? autoDetected ?? "none";
  const isAutoSuggested = manualPriority === null && autoDetected !== null;

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed, priority);
    setValue("");
    setManualPriority(null);
  };

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center rounded-xl bg-white/70 dark:bg-white/10 border border-accent-900/5 dark:border-white/5 px-3">
        <Ionicons name="add" size={20} color="#c98a9c" />
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text);
            // A fresh keyword match should be able to re-suggest after the user clears their pin.
            if (manualPriority === "none" && detectPriorityFromTitle(text) === null) {
              setManualPriority(null);
            }
          }}
          placeholder={placeholder}
          placeholderTextColor="#c9a0ad"
          onSubmitEditing={submit}
          returnKeyType="done"
          className="flex-1 px-2 py-3 text-base text-ink-light dark:text-ink-dark"
        />
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
      {priority !== "none" && (
        <View className="flex-row items-center gap-1.5 px-1">
          <Ionicons name="flag" size={12} color={PRIORITY_COLOR[priority]} />
          <Text className="text-xs" style={{ color: PRIORITY_COLOR[priority] }}>
            {isAutoSuggested ? `${PRIORITY_LABEL[priority]} detected` : PRIORITY_LABEL[priority]}
          </Text>
          <Pressable onPress={() => setManualPriority("none")} hitSlop={6}>
            <Text className="text-xs text-ink-light/40 dark:text-ink-dark/40 underline">clear</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
