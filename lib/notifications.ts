import { useQuery } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Task } from "@/types/task";

const permissionStatusKey = ["notification-permission-status"] as const;

export function useNotificationPermissionStatus() {
  return useQuery({
    queryKey: permissionStatusKey,
    queryFn: async () => {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    },
    enabled: Platform.OS !== "web",
  });
}

export async function requestNotificationPermission() {
  if (Platform.OS === "web") return;
  try {
    await Notifications.requestPermissionsAsync();
  } catch {
    // Best-effort: a denied/unavailable permission just means reminders won't fire.
  }
}

export async function scheduleTaskReminder(task: Task) {
  if (Platform.OS === "web") return;
  if (!task.due_date || !task.due_time || task.completed) return;

  const [year, month, day] = task.due_date.split("-").map(Number);
  const [hour, minute] = task.due_time.split(":").map(Number);
  const dueAt = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (dueAt.getTime() <= Date.now()) return;

  try {
    await Notifications.scheduleNotificationAsync({
      // Deterministic identifier == task.id, so we can cancel/reschedule this
      // task's reminder later without persisting a separate notification id.
      identifier: task.id,
      content: { title: task.title, body: task.title },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dueAt },
    });
  } catch {
    // Best-effort: scheduling can fail if permission was never granted.
  }
}

export async function cancelTaskReminder(taskId: string) {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(taskId);
  } catch {
    // Safe no-op if nothing was scheduled under this id.
  }
}
