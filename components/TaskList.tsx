import { Text, View } from "react-native";
import { TaskItem } from "./TaskItem";
import type { Task } from "@/types/task";

export function TaskList({
  tasks,
  emptyLabel,
  onToggle,
  onDelete,
}: {
  tasks: Task[];
  emptyLabel: string;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (tasks.length === 0) {
    return (
      <View className="items-center justify-center py-16">
        <Text className="text-gray-400 dark:text-gray-500 text-center">{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={() => onToggle(task)}
          onDelete={() => onDelete(task)}
        />
      ))}
    </View>
  );
}
