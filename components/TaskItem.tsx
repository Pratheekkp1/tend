import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { Pressable, Text, View } from "react-native";
import { Checkbox } from "./ui/Checkbox";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/priority";
import type { Task } from "@/types/task";

export function TaskItem({
  task,
  overdue = false,
  showDueDate = false,
  onToggle,
  onDelete,
  onCyclePriority,
}: {
  task: Task;
  overdue?: boolean;
  showDueDate?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onCyclePriority: () => void;
}) {
  return (
    <View
      className={`flex-row items-center gap-3 rounded-xl bg-white/70 dark:bg-surface-dark-subtle/70 px-4 py-3 border ${
        overdue ? "border-accent-500/40" : "border-accent-900/5 dark:border-white/5"
      }`}
    >
      <Checkbox checked={task.completed} onToggle={onToggle} />
      <View className="flex-1">
        <Text
          className={`text-base ${
            task.completed
              ? "text-ink-light/35 dark:text-ink-dark/35 line-through"
              : "text-ink-light dark:text-ink-dark"
          }`}
        >
          {task.title}
        </Text>
        {(task.notes || (showDueDate && task.due_date) || overdue) && (
          <View className="mt-0.5 flex-row items-center gap-2">
            {overdue && (
              <Text className="text-xs font-semibold text-accent-700 dark:text-accent-300">Overdue</Text>
            )}
            {showDueDate && task.due_date && !overdue ? (
              <Text className="text-xs text-ink-light/45 dark:text-ink-dark/45">
                {format(parseISO(task.due_date), "MMM d")}
              </Text>
            ) : null}
            {task.notes ? (
              <Text className="text-sm text-ink-light/45 dark:text-ink-dark/45 flex-1" numberOfLines={1}>
                {task.notes}
              </Text>
            ) : null}
          </View>
        )}
      </View>
      <Pressable
        onPress={onCyclePriority}
        hitSlop={8}
        className="p-1"
        accessibilityLabel={PRIORITY_LABEL[task.priority]}
      >
        <Ionicons
          name={task.priority === "none" ? "flag-outline" : "flag"}
          size={17}
          color={task.priority === "none" ? "#cbb9ad" : PRIORITY_COLOR[task.priority]}
        />
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={8} className="p-1">
        <Ionicons name="trash-outline" size={18} color="#b0a08f" />
      </Pressable>
    </View>
  );
}
