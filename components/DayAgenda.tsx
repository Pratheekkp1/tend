import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { QuickAddInput } from "./ui/QuickAddInput";
import { TaskDetailModal } from "./TaskDetailModal";
import { TaskList } from "./TaskList";
import type { GoogleCalendarEvent, Priority, Recurrence, Task } from "@/types/task";

const ACCENT = "#f28482";

/** The header + Google events + quick-add + task lists shown for a selected
 * day. Reused by both the phone bottom sheet and the wide-screen split view. */
export function DayAgenda({
  dateObj,
  googleConnected,
  googleEvents,
  loadingEvents,
  pending,
  completed,
  onCreateTask,
  onToggle,
  onDelete,
  onCyclePriority,
  onClose,
}: {
  dateObj: Date;
  googleConnected: boolean;
  googleEvents: GoogleCalendarEvent[];
  loadingEvents: boolean;
  pending: Task[];
  completed: Task[];
  onCreateTask: (title: string, priority: Priority, dueTime: string | null, recurrence: Recurrence) => void;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCyclePriority: (task: Task) => void;
  onClose?: () => void;
}) {
  const [detailTask, setDetailTask] = useState<Task | null>(null);

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-5 pb-8"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-lg font-bold text-ink-light dark:text-ink-dark">
          {format(dateObj, "EEEE, MMMM d")}
        </Text>
        {onClose && (
          <Pressable onPress={onClose} hitSlop={8} className="p-1">
            <Ionicons name="close" size={20} color="#c9a08f" />
          </Pressable>
        )}
      </View>

      {googleConnected && (
        <View className="mt-4 gap-2">
          {loadingEvents ? (
            <ActivityIndicator size="small" />
          ) : googleEvents.length > 0 ? (
            googleEvents.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => event.htmlLink && Linking.openURL(event.htmlLink)}
                className="flex-row items-center gap-2 rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-500/10 px-3 py-2.5"
              >
                <Ionicons name="calendar-clear-outline" size={16} color={ACCENT} />
                <View className="flex-1">
                  <Text className="text-sm font-medium text-ink-light dark:text-ink-dark">
                    {event.title}
                  </Text>
                  {!event.allDay && (
                    <Text className="text-xs text-ink-light/55 dark:text-ink-dark/55">
                      {format(new Date(event.start), "h:mm a")} –{" "}
                      {format(new Date(event.end), "h:mm a")}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))
          ) : null}
        </View>
      )}

      <View className="mt-5">
        <QuickAddInput placeholder="Add a task for this day" onSubmit={onCreateTask} />
      </View>

      <View className="mt-5">
        <TaskList
          tasks={pending}
          emptyLabel="Nothing scheduled."
          onToggle={onToggle}
          onDelete={onDelete}
          onCyclePriority={onCyclePriority}
          onOpenDetail={setDetailTask}
        />
      </View>

      {completed.length > 0 && (
        <View className="mt-5">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-light/45 dark:text-ink-dark/45">
            Completed
          </Text>
          <TaskList
            tasks={completed}
            emptyLabel=""
            onToggle={onToggle}
            onDelete={onDelete}
            onCyclePriority={onCyclePriority}
            onOpenDetail={setDetailTask}
          />
        </View>
      )}

      <TaskDetailModal
        task={detailTask}
        onClose={() => setDetailTask(null)}
        onDelete={(task) => {
          onDelete(task);
          setDetailTask(null);
        }}
      />
    </ScrollView>
  );
}
