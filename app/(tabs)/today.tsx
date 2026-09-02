import { Ionicons } from "@expo/vector-icons";
import { addDays, format, isToday, parseISO } from "date-fns";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuickAddInput } from "@/components/ui/QuickAddInput";
import { TaskList } from "@/components/TaskList";
import { useCreateTask, useDayTasks, useDeleteTask, useUpdateTask } from "@/lib/tasks";
import type { Task } from "@/types/task";

export default function Today() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const { data: tasks = [] } = useDayTasks(selectedDate);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const dateObj = parseISO(selectedDate);
  const shiftDate = (days: number) =>
    setSelectedDate(format(addDays(dateObj, days), "yyyy-MM-dd"));

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <ScrollView
      style={{ paddingTop: insets.top }}
      contentContainerClassName="px-5 pb-8"
      className="flex-1"
    >
      <View className="flex-row items-center justify-between pt-4 pb-1">
        <View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {isToday(dateObj) ? "Today" : format(dateObj, "EEEE")}
          </Text>
          <Text className="text-sm text-gray-400 dark:text-gray-500">
            {format(dateObj, "MMMM d, yyyy")}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => shiftDate(-1)}
            className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10"
          >
            <Ionicons name="chevron-back" size={18} color="#6b7280" />
          </Pressable>
          {!isToday(dateObj) && (
            <Pressable
              onPress={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
              className="rounded-full bg-gray-100 dark:bg-white/10 px-3 py-2"
            >
              <Text className="text-xs font-medium text-gray-600 dark:text-gray-300">Today</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => shiftDate(1)}
            className="h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10"
          >
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </Pressable>
        </View>
      </View>

      <View className="mt-5">
        <QuickAddInput
          placeholder="Add a task for this day"
          onSubmit={(title) => createTask.mutate({ title, due_date: selectedDate })}
        />
      </View>

      <View className="mt-6">
        <TaskList
          tasks={pending}
          emptyLabel="Nothing due this day. Enjoy the calm."
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
