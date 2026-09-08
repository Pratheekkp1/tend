import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuickAddInput } from "@/components/ui/QuickAddInput";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { TaskList } from "@/components/TaskList";
import { cyclePriority } from "@/lib/priority";
import { useAllTaskTags, useTags } from "@/lib/tags";
import {
  useCreateTask,
  useDeleteTask,
  useGeneralTasks,
  useToggleTaskCompletion,
  useUpdateTask,
} from "@/lib/tasks";
import { useUndoToast } from "@/lib/undoToast";
import type { Task } from "@/types/task";

export default function Todos() {
  const insets = useSafeAreaInsets();
  const { data: tasks = [] } = useGeneralTasks();
  const { data: tags = [] } = useTags();
  const { data: taskTags } = useAllTaskTags();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggle = useToggleTaskCompletion();
  const { notifyDeleted } = useUndoToast();
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  const matchesTag = (task: Task) =>
    !activeTagId || (taskTags?.[task.id] ?? []).some((tag) => tag.id === activeTagId);
  const filtered = tasks.filter(matchesTag);

  const pending = filtered.filter((t) => !t.completed);
  const completed = filtered.filter((t) => t.completed);

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

      {tags.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="mt-4 gap-2"
        >
          {tags.map((tag) => {
            const active = activeTagId === tag.id;
            return (
              <Pressable
                key={tag.id}
                onPress={() => setActiveTagId(active ? null : tag.id)}
                className={`flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                  active ? "border-transparent" : "bg-white/70 dark:bg-white/10 border-accent-900/5 dark:border-white/5"
                }`}
                style={active ? { backgroundColor: tag.color } : undefined}
              >
                {!active && <View className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color }} />}
                <Text
                  className={`text-xs font-medium ${
                    active ? "text-white" : "text-ink-light/70 dark:text-ink-dark/70"
                  }`}
                >
                  {tag.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View className="mt-6">
        <TaskList
          tasks={pending}
          emptyLabel="Your backlog is empty."
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
