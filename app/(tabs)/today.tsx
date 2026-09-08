import { Ionicons } from "@expo/vector-icons";
import { addDays, format, isToday, parseISO } from "date-fns";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuickAddInput } from "@/components/ui/QuickAddInput";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { TaskList } from "@/components/TaskList";
import { cyclePriority } from "@/lib/priority";
import {
  useCreateTask,
  useDayTasks,
  useDeleteTask,
  useOverdueTasks,
  useToggleTaskCompletion,
  useUpdateTask,
} from "@/lib/tasks";
import { useUndoToast } from "@/lib/undoToast";
import type { Task } from "@/types/task";

export default function Today() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const { data: tasks = [] } = useDayTasks(selectedDate);
  const { data: overdue = [] } = useOverdueTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggle = useToggleTaskCompletion();
  const { notifyDeleted } = useUndoToast();
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const dateObj = parseISO(selectedDate);
  const viewingToday = isToday(dateObj);
  const shiftDate = (days: number) =>
    setSelectedDate(format(addDays(dateObj, days), "yyyy-MM-dd"));

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  const remove = (task: Task) => {
    deleteTask.mutate(task.id);
    notifyDeleted(task);
  };
  const cycle = (task: Task) =>
    updateTask.mutate({ id: task.id, patch: { priority: cyclePriority(task.priority) } });

  return (
    <ScrollView
      style={{ paddingTop: insets.top }}
      contentContainerClassName="px-5 pb-8"
      className="flex-1"
    >
      <View className="flex-row items-center justify-between pt-4 pb-1">
        <View>
          <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">
            {viewingToday ? "Today" : format(dateObj, "EEEE")}
          </Text>
          <Text className="text-sm text-ink-light/45 dark:text-ink-dark/45">
            {format(dateObj, "MMMM d, yyyy")}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => shiftDate(-1)}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/70 dark:bg-white/10"
          >
            <Ionicons name="chevron-back" size={18} color="#c25553" />
          </Pressable>
          {!viewingToday && (
            <Pressable
              onPress={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}
              className="rounded-full bg-white/70 dark:bg-white/10 px-3 py-2"
            >
              <Text className="text-xs font-medium text-ink-light/70 dark:text-ink-dark/70">Today</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => shiftDate(1)}
            className="h-9 w-9 items-center justify-center rounded-full bg-white/70 dark:bg-white/10"
          >
            <Ionicons name="chevron-forward" size={18} color="#c25553" />
          </Pressable>
        </View>
      </View>

      <View className="mt-5">
        <QuickAddInput
          placeholder="Add a task for this day"
          onSubmit={(title, priority, dueTime, recurrence) =>
            createTask.mutate({
              title,
              due_date: selectedDate,
              priority,
              due_time: dueTime,
              recurrence,
            })
          }
        />
      </View>

      {viewingToday && overdue.length > 0 && (
        <View className="mt-6">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-700 dark:text-accent-300">
            Overdue
          </Text>
          <TaskList
            tasks={overdue}
            emptyLabel=""
            showDueDate
            onToggle={toggle}
            onDelete={remove}
            onCyclePriority={cycle}
            onOpenDetail={setDetailTask}
          />
        </View>
      )}

      <View className="mt-6">
        <TaskList
          tasks={pending}
          emptyLabel="Nothing due this day. Enjoy the calm."
          onToggle={toggle}
          onDelete={remove}
          onCyclePriority={cycle}
          onOpenDetail={setDetailTask}
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
            onOpenDetail={setDetailTask}
          />
        </View>
      )}

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onDelete={(task) => {
          deleteTask.mutate(task.id);
          notifyDeleted(task);
          setDetailTask(null);
        }}
      />
    </ScrollView>
  );
}
