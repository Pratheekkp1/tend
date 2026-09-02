import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Checkbox } from "./ui/Checkbox";
import type { Task } from "@/types/task";

export function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-xl bg-white dark:bg-surface-dark-subtle px-4 py-3 border border-gray-100 dark:border-white/5">
      <Checkbox checked={task.completed} onToggle={onToggle} />
      <View className="flex-1">
        <Text
          className={`text-base ${
            task.completed
              ? "text-gray-400 dark:text-gray-500 line-through"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {task.title}
        </Text>
        {task.notes ? (
          <Text className="mt-0.5 text-sm text-gray-400 dark:text-gray-500" numberOfLines={1}>
            {task.notes}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={onDelete} hitSlop={8} className="p-1">
        <Ionicons name="trash-outline" size={18} color="#9ca3af" />
      </Pressable>
    </View>
  );
}
