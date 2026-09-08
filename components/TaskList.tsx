import { format } from "date-fns";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { TaskItem } from "./TaskItem";
import { isOverdue } from "@/lib/priority";
import { cycleRecurrence } from "@/lib/recurrence";
import { useUpdateTask } from "@/lib/tasks";
import type { Task } from "@/types/task";

export function TaskList({
  tasks,
  emptyLabel,
  showDueDate = false,
  onToggle,
  onDelete,
  onCyclePriority,
  onOpenDetail,
}: {
  tasks: Task[];
  emptyLabel: string;
  showDueDate?: boolean;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCyclePriority: (task: Task) => void;
  onOpenDetail?: (task: Task) => void;
}) {
  const todayISO = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const updateTask = useUpdateTask();

  if (tasks.length === 0) {
    return (
      <View className="items-center justify-center py-16">
        <Text className="text-ink-light/45 dark:text-ink-dark/45 text-center">{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <View className="gap-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          overdue={isOverdue(task, todayISO)}
          showDueDate={showDueDate}
          onToggle={() => onToggle(task)}
          onDelete={() => onDelete(task)}
          onCyclePriority={() => onCyclePriority(task)}
          onCycleRecurrence={() =>
            updateTask.mutate({ id: task.id, patch: { recurrence: cycleRecurrence(task.recurrence) } })
          }
          onOpenDetail={onOpenDetail}
        />
      ))}
    </View>
  );
}
