import { Ionicons } from "@expo/vector-icons";
import { addDays, format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Checkbox } from "./ui/Checkbox";
import { TextField } from "./ui/TextField";
import { TimePickerButton } from "./ui/TimePickerButton";
import { glassBlur } from "@/lib/glass";
import { cyclePriority, PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/priority";
import { cycleRecurrence, RECURRENCE_LABEL } from "@/lib/recurrence";
import { useCreateSubtask, useDeleteSubtask, useSubtasks, useToggleSubtask } from "@/lib/subtasks";
import { formatTime12h } from "@/lib/time";
import { useUpdateTask } from "@/lib/tasks";
import type { Task, TaskUpdate } from "@/types/task";

const FIELD_LABEL = "mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-light/45 dark:text-ink-dark/45";

export function TaskDetailModal({
  task,
  onClose,
  onDelete,
}: {
  task: Task | null;
  onClose: () => void;
  onDelete: (task: Task) => void;
}) {
  const updateTask = useUpdateTask();
  const { height } = useWindowDimensions();
  // The screens that open this modal derive their task lists from
  // day/priority-filtered queries, so a mutation that moves a task out of
  // the current filter (e.g. rescheduling it to another day) would make it
  // vanish from those lists mid-edit. Track our own optimistic copy here,
  // patched immediately on every change, instead of depending on the
  // parent's `task` prop staying live for the whole time the modal is open.
  const [current, setCurrent] = useState<Task | null>(task);
  const [title, setTitle] = useState(task?.title ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");

  useEffect(() => {
    setCurrent(task);
    setTitle(task?.title ?? "");
    setNotes(task?.notes ?? "");
  }, [task?.id]);

  if (!current) return null;

  const applyPatch = (patch: TaskUpdate) => {
    updateTask.mutate({ id: current.id, patch });
    setCurrent((c) => (c ? { ...c, ...patch } : c));
  };

  const commitTitle = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setTitle(current.title);
      return;
    }
    if (trimmed !== current.title) {
      applyPatch({ title: trimmed });
    }
  };

  const commitNotes = () => {
    const trimmed = notes.trim();
    const next = trimmed.length > 0 ? trimmed : null;
    if (next !== (current.notes ?? null)) {
      applyPatch({ notes: next });
    }
  };

  const handleClose = () => {
    commitTitle();
    commitNotes();
    onClose();
  };

  const handleDelete = () => {
    onDelete(current);
    onClose();
  };

  const setDueDate = (iso: string) => applyPatch({ due_date: iso });
  const clearDueDate = () => applyPatch({ due_date: null, due_time: null });
  const stepDueDate = (deltaDays: number) => {
    if (!current.due_date) return;
    setDueDate(format(addDays(parseISO(current.due_date), deltaDays), "yyyy-MM-dd"));
  };

  const todayISO = format(new Date(), "yyyy-MM-dd");
  const tomorrowISO = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const nextWeekISO = format(addDays(new Date(), 7), "yyyy-MM-dd");

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        onPress={handleClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl overflow-hidden border border-black/5 dark:border-white/10 bg-surface-light dark:bg-surface-dark-subtle/90"
          style={glassBlur}
        >
          <View className="px-4 py-3 border-b border-black/5 dark:border-white/10">
            <Text className="text-center font-semibold text-ink-light dark:text-ink-dark">Task details</Text>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: height * 0.65 }}
            contentContainerClassName="p-4 gap-4"
          >
            <View>
              <Text className={FIELD_LABEL}>Title</Text>
              <TextField
                value={title}
                onChangeText={setTitle}
                onBlur={commitTitle}
                placeholder="Task title"
                returnKeyType="done"
              />
            </View>

            <View>
              <Text className={FIELD_LABEL}>Notes</Text>
              <TextField
                value={notes}
                onChangeText={setNotes}
                onBlur={commitNotes}
                placeholder="Add notes..."
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
              />
            </View>

            <View>
              <Text className={FIELD_LABEL}>Due date</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-base text-ink-light dark:text-ink-dark">
                  {current.due_date ? format(parseISO(current.due_date), "EEE, MMM d") : "No date"}
                </Text>
                {current.due_date && (
                  <Pressable
                    onPress={clearDueDate}
                    hitSlop={8}
                    className="flex-row items-center gap-1 rounded-lg px-2 py-1 active:bg-black/5 dark:active:bg-white/5"
                  >
                    <Ionicons name="close-circle-outline" size={14} color="#b0a08f" />
                    <Text className="text-xs text-ink-light/50 dark:text-ink-dark/50">Clear</Text>
                  </Pressable>
                )}
              </View>

              <View className="mt-2.5 flex-row flex-wrap items-center gap-2">
                <QuickDateChip label="Today" active={current.due_date === todayISO} onPress={() => setDueDate(todayISO)} />
                <QuickDateChip
                  label="Tomorrow"
                  active={current.due_date === tomorrowISO}
                  onPress={() => setDueDate(tomorrowISO)}
                />
                <QuickDateChip
                  label="Next week"
                  active={current.due_date === nextWeekISO}
                  onPress={() => setDueDate(nextWeekISO)}
                />
                {current.due_date && (
                  <View className="ml-auto flex-row items-center gap-1.5">
                    <Pressable
                      onPress={() => stepDueDate(-1)}
                      hitSlop={8}
                      className="h-7 w-7 items-center justify-center rounded-full bg-accent-500/10 active:bg-accent-500/20"
                      accessibilityLabel="One day earlier"
                    >
                      <Ionicons name="chevron-back" size={14} color="#f28482" />
                    </Pressable>
                    <Pressable
                      onPress={() => stepDueDate(1)}
                      hitSlop={8}
                      className="h-7 w-7 items-center justify-center rounded-full bg-accent-500/10 active:bg-accent-500/20"
                      accessibilityLabel="One day later"
                    >
                      <Ionicons name="chevron-forward" size={14} color="#f28482" />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

            {current.due_date && (
              <View className="flex-row items-center justify-between">
                <Text className={FIELD_LABEL}>Due time</Text>
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-ink-light/60 dark:text-ink-dark/60">
                    {current.due_time ? formatTime12h(current.due_time) : "No time"}
                  </Text>
                  <TimePickerButton
                    value={current.due_time}
                    onChange={(time) => applyPatch({ due_time: time })}
                  />
                </View>
              </View>
            )}

            <View>
              <Text className={FIELD_LABEL}>Subtasks</Text>
              <SubtasksSection taskId={current.id} />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className={FIELD_LABEL}>Priority</Text>
              <Pressable
                onPress={() => applyPatch({ priority: cyclePriority(current.priority) })}
                hitSlop={8}
                className="flex-row items-center gap-1.5 rounded-lg px-2 py-1 active:bg-black/5 dark:active:bg-white/5"
              >
                <Ionicons
                  name={current.priority === "none" ? "flag-outline" : "flag"}
                  size={16}
                  color={current.priority === "none" ? "#cbb9ad" : PRIORITY_COLOR[current.priority]}
                />
                <Text className="text-sm text-ink-light dark:text-ink-dark">{PRIORITY_LABEL[current.priority]}</Text>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className={FIELD_LABEL}>Repeats</Text>
              <Pressable
                onPress={() => applyPatch({ recurrence: cycleRecurrence(current.recurrence) })}
                hitSlop={8}
                className="flex-row items-center gap-1.5 rounded-lg px-2 py-1 active:bg-black/5 dark:active:bg-white/5"
              >
                <Ionicons
                  name={current.recurrence === "none" ? "repeat-outline" : "repeat"}
                  size={16}
                  color={current.recurrence === "none" ? "#cbb9ad" : "#84a59d"}
                />
                <Text className="text-sm text-ink-light dark:text-ink-dark">{RECURRENCE_LABEL[current.recurrence]}</Text>
              </Pressable>
            </View>
          </ScrollView>

          <View className="flex-row border-t border-black/5 dark:border-white/10">
            <Pressable onPress={handleDelete} className="flex-1 items-center py-3 active:bg-accent-500/10">
              <Text className="text-sm font-semibold text-accent-600 dark:text-accent-400">Delete</Text>
            </Pressable>
            <View className="w-px bg-black/5 dark:bg-white/10" />
            <Pressable onPress={handleClose} className="flex-1 items-center py-3 active:bg-black/5 dark:active:bg-white/5">
              <Text className="text-sm font-semibold text-ink-light dark:text-ink-dark">Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SubtasksSection({ taskId }: { taskId: string }) {
  const { data: subtasks = [] } = useSubtasks(taskId);
  const createSubtask = useCreateSubtask();
  const toggleSubtask = useToggleSubtask();
  const deleteSubtask = useDeleteSubtask();
  const [title, setTitle] = useState("");

  const addSubtask = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    createSubtask.mutate({ task_id: taskId, title: trimmed });
    setTitle("");
  };

  return (
    <View className="gap-2">
      {subtasks.map((subtask) => (
        <View key={subtask.id} className="flex-row items-center gap-2.5">
          <Checkbox checked={subtask.completed} onToggle={() => toggleSubtask.mutate(subtask)} />
          <Text
            className={`flex-1 text-sm ${
              subtask.completed
                ? "text-ink-light/35 dark:text-ink-dark/35 line-through"
                : "text-ink-light dark:text-ink-dark"
            }`}
          >
            {subtask.title}
          </Text>
          <Pressable onPress={() => deleteSubtask.mutate(subtask.id)} hitSlop={8} className="p-1">
            <Ionicons name="trash-outline" size={16} color="#b0a08f" />
          </Pressable>
        </View>
      ))}
      <TextField
        value={title}
        onChangeText={setTitle}
        onSubmitEditing={addSubtask}
        placeholder="Add a subtask"
        returnKeyType="done"
        className="py-2"
      />
    </View>
  );
}

function QuickDateChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full border px-3 py-1.5 ${
        active
          ? "bg-accent-500 border-accent-500"
          : "bg-white/70 dark:bg-white/10 border-accent-900/5 dark:border-white/5"
      }`}
    >
      <Text className={`text-xs font-medium ${active ? "text-white" : "text-ink-light/70 dark:text-ink-dark/70"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
