import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuickAddInput } from "@/components/ui/QuickAddInput";
import { TaskList } from "@/components/TaskList";
import { useCreateTask, useDeleteTask, useGeneralTasks, useUpdateTask } from "@/lib/tasks";
import type { Task } from "@/types/task";

export default function Todos() {
  const insets = useSafeAreaInsets();
  const { data: tasks = [] } = useGeneralTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <ScrollView
      style={{ paddingTop: insets.top }}
      contentContainerClassName="px-5 pb-8"
      className="flex-1"
    >
      <View className="pt-4 pb-1">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Todos</Text>
        <Text className="text-sm text-gray-400 dark:text-gray-500">
          Your backlog — no date attached
        </Text>
      </View>

      <View className="mt-5">
        <QuickAddInput
          placeholder="Add to your backlog"
          onSubmit={(title) => createTask.mutate({ title })}
        />
      </View>

      <View className="mt-6">
        <TaskList
          tasks={pending}
          emptyLabel="Your backlog is empty."
          onToggle={(task: Task) =>
            updateTask.mutate({ id: task.id, patch: { completed: !task.completed } })
          }
          onDelete={(task: Task) => deleteTask.mutate(task.id)}
        />
      </View>

      {completed.length > 0 && (
        <View className="mt-6">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Completed
          </Text>
          <TaskList
            tasks={completed}
            emptyLabel=""
            onToggle={(task: Task) =>
              updateTask.mutate({ id: task.id, patch: { completed: !task.completed } })
            }
            onDelete={(task: Task) => deleteTask.mutate(task.id)}
          />
        </View>
      )}
    </ScrollView>
  );
}
