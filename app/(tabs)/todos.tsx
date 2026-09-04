import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuickAddInput } from "@/components/ui/QuickAddInput";
import { TaskList } from "@/components/TaskList";
import { cyclePriority } from "@/lib/priority";
import {
  useCreateTask,
  useDeleteTask,
  useGeneralTasks,
  useToggleTaskCompletion,
  useUpdateTask,
} from "@/lib/tasks";
import type { Task } from "@/types/task";

export default function Todos() {
  const insets = useSafeAreaInsets();
  const { data: tasks = [] } = useGeneralTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggle = useToggleTaskCompletion();

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const remove = (task: Task) => deleteTask.mutate(task.id);
  const cycle = (task: Task) =>
    updateTask.mutate({ id: task.id, patch: { priority: cyclePriority(task.priority) } });

  return (
    <ScrollView
      style={{ paddingTop: insets.top }}
      contentContainerClassName="px-5 pb-8"
      className="flex-1"
    >
      <View className="pt-4 pb-1">
        <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">Todos</Text>
        <Text className="text-sm text-ink-light/45 dark:text-ink-dark/45">
          Your backlog — no date attached
        </Text>
      </View>

      <View className="mt-5">
        <QuickAddInput
          placeholder="Add to your backlog"
          onSubmit={(title, priority) => createTask.mutate({ title, priority })}
        />
      </View>

      <View className="mt-6">
        <TaskList
          tasks={pending}
          emptyLabel="Your backlog is empty."
          onToggle={toggle}
          onDelete={remove}
          onCyclePriority={cycle}
        />
      </View>

      {completed.length > 0 && (
        <View className="mt-6">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-light/45 dark:text-ink-dark/45">
            Completed
          </Text>
          <TaskList
            tasks={completed}
            emptyLabel=""
            onToggle={toggle}
            onDelete={remove}
            onCyclePriority={cycle}
          />
        </View>
      )}
    </ScrollView>
  );
}
