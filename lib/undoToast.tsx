import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCreateTask } from "./tasks";
import type { Task } from "@/types/task";

const DISMISS_MS = 5000;
// Clears the phone tab bar (~54px content + bottom inset) with room to spare;
// on wide/no-tab-bar layouts this just floats the toast a bit higher, which is fine.
const TAB_BAR_CLEARANCE = 76;

interface UndoToastContextValue {
  notifyDeleted: (task: Task) => void;
}

const UndoToastContext = createContext<UndoToastContextValue>({
  notifyDeleted: () => {},
});

export function UndoToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const createTask = useCreateTask();

  const [task, setTask] = useState<Task | null>(null);
  // Keeps rendering the last deleted task's title while the toast animates
  // out, instead of the content blanking a beat before the fade finishes.
  const [displayTask, setDisplayTask] = useState<Task | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const dismiss = useCallback(() => {
    clearTimer();
    setTask(null);
  }, []);

  const notifyDeleted = useCallback((deleted: Task) => {
    clearTimer();
    setTask(deleted);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setTask(null);
    }, DISMISS_MS);
  }, []);

  useEffect(() => {
    if (task) setDisplayTask(task);
  }, [task]);

  useEffect(() => {
    const visible = task !== null;
    translateY.value = withTiming(visible ? 0 : 40, { duration: 220 });
    opacity.value = withTiming(visible ? 1 : 0, { duration: 220 });
  }, [task, translateY, opacity]);

  useEffect(() => clearTimer, []);

  const handleUndo = () => {
    if (!displayTask) return;
    createTask.mutate({
      title: displayTask.title,
      notes: displayTask.notes ?? undefined,
      due_date: displayTask.due_date ?? undefined,
      due_time: displayTask.due_time ?? undefined,
      duration_minutes: displayTask.duration_minutes ?? undefined,
      priority: displayTask.priority,
      recurrence: displayTask.recurrence,
    });
    dismiss();
  };

  const toastStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <UndoToastContext.Provider value={{ notifyDeleted }}>
      {children}
      <View pointerEvents={task ? "box-none" : "none"} className="absolute inset-0 items-center justify-end">
        {/* Animated.View stays className-free -- NativeWind classes on an
         * Animated.View don't reliably apply on web (see DaySheet.tsx),
         * so the pill's own look lives on a plain nested View instead. */}
        <Animated.View style={[{ marginBottom: insets.bottom + TAB_BAR_CLEARANCE }, toastStyle]}>
          <View className="flex-row items-center gap-4 rounded-full bg-ink-light dark:bg-ink-dark px-4 py-3">
            <Text className="text-sm font-medium text-surface-light dark:text-surface-dark">
              Task deleted
            </Text>
            <Pressable onPress={handleUndo} hitSlop={8}>
              <Text className="text-sm font-semibold text-accent-300 dark:text-accent-600">Undo</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </UndoToastContext.Provider>
  );
}

export function useUndoToast() {
  return useContext(UndoToastContext);
}
