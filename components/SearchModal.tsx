import { useState } from "react";
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TaskDetailModal } from "./TaskDetailModal";
import { TaskList } from "./TaskList";
import { TextField } from "./ui/TextField";
import { glassBlur } from "@/lib/glass";
import { cyclePriority } from "@/lib/priority";
import { useDeleteTask, useSearchTasks, useToggleTaskCompletion, useUpdateTask } from "@/lib/tasks";
import { useUndoToast } from "@/lib/undoToast";
import type { Task } from "@/types/task";

export function SearchModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  const { data: results = [] } = useSearchTasks(query);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggle = useToggleTaskCompletion();
  const { notifyDeleted } = useUndoToast();

  if (!visible) return null;

  const handleClose = () => {
    setQuery("");
    setDetailTask(null);
    onClose();
  };

  const remove = (task: Task) => {
    deleteTask.mutate(task.id);
    notifyDeleted(task);
  };
  const cycle = (task: Task) =>
    updateTask.mutate({ id: task.id, patch: { priority: cyclePriority(task.priority) } });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable
        className="flex-1 items-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.35)", paddingTop: insets.top + 72 }}
        onPress={handleClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 bg-surface-light dark:bg-surface-dark-subtle/90"
          style={glassBlur}
        >
          <View className="px-4 py-3 border-b border-black/5 dark:border-white/10">
            <TextField
              value={query}
              onChangeText={setQuery}
              placeholder="Search tasks..."
              autoFocus
              returnKeyType="search"
            />
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: height * 0.5 }}
            contentContainerClassName="px-3 pt-3 pb-3"
          >
            <TaskList
              tasks={results}
              emptyLabel={query.trim() ? "No tasks found" : "Type to search your tasks"}
              showDueDate
              onToggle={toggle}
              onDelete={remove}
              onCyclePriority={cycle}
              onOpenDetail={setDetailTask}
            />
          </ScrollView>
        </Pressable>
      </Pressable>

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onDelete={(task) => {
          deleteTask.mutate(task.id);
          notifyDeleted(task);
          setDetailTask(null);
        }}
      />
    </Modal>
  );
}
