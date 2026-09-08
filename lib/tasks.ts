import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useEffect } from "react";
import { useAuth } from "./auth-context";
import { cancelTaskReminder, scheduleTaskReminder } from "./notifications";
import { compareTasks, PRIORITY_ORDER } from "./priority";
import { nextOccurrenceDate } from "./recurrence";
import { supabase } from "./supabase";
import type { NewTask, Task, TaskUpdate } from "@/types/task";

const tasksKey = (userId: string | undefined) => ["tasks", userId] as const;

async function fetchAllTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Loads every task for the signed-in user once, cached and shared by all screens. */
function useAllTasks() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: tasksKey(userId),
    queryFn: () => fetchAllTasks(userId as string),
    enabled: Boolean(userId),
  });
}

/** Keeps the cache live: any change from another device patches this device's list too. */
export function useRealtimeTasksSync() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`tasks-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: tasksKey(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

export function useGeneralTasks() {
  const { data, ...rest } = useAllTasks();
  return { data: data?.filter((t) => !t.due_date).sort(compareTasks), ...rest };
}

export function useDayTasks(date: string) {
  const { data, ...rest } = useAllTasks();
  return { data: data?.filter((t) => t.due_date === date).sort(compareTasks), ...rest };
}

/** Tasks due within [startISO, endISO], inclusive -- for Week view. */
export function useTasksInRange(startISO: string, endISO: string) {
  const { data, ...rest } = useAllTasks();
  const inRange = (data ?? [])
    .filter((t) => t.due_date && t.due_date >= startISO && t.due_date <= endISO)
    .sort(compareTasks);
  return { data: inRange, ...rest };
}

/** Case-insensitive substring match against title/notes, sorted with title
 * matches ahead of notes-only matches. Empty query returns no results rather
 * than the whole task list. */
export function useSearchTasks(query: string) {
  const { data, ...rest } = useAllTasks();
  const needle = query.trim().toLowerCase();

  if (!needle) return { data: [], ...rest };

  const titleMatch = (t: Task) => t.title.toLowerCase().includes(needle);
  const matches = (data ?? []).filter(
    (t) => titleMatch(t) || (t.notes ?? "").toLowerCase().includes(needle)
  );
  matches.sort((a, b) => {
    const byTitle = Number(titleMatch(b)) - Number(titleMatch(a));
    return byTitle !== 0 ? byTitle : compareTasks(a, b);
  });

  return { data: matches, ...rest };
}

/** Incomplete tasks whose due date is strictly before `beforeISO` (defaults to today). */
export function useOverdueTasks(beforeISO?: string) {
  const cutoff = beforeISO ?? format(new Date(), "yyyy-MM-dd");
  const { data, ...rest } = useAllTasks();
  const overdue = (data ?? [])
    .filter((t) => !t.completed && t.due_date && t.due_date < cutoff)
    .sort((a, b) => {
      const dateDiff = (a.due_date as string).localeCompare(b.due_date as string);
      if (dateDiff !== 0) return dateDiff;
      return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
    });
  return { data: overdue, ...rest };
}

/** Maps "YYYY-MM-DD" -> count of incomplete tasks, for calendar dot markers. */
export function useTaskCountsByDate() {
  const { data, ...rest } = useAllTasks();
  const counts: Record<string, number> = {};
  for (const task of data ?? []) {
    if (task.due_date && !task.completed) {
      counts[task.due_date] = (counts[task.due_date] ?? 0) + 1;
    }
  }
  return { data: counts, ...rest };
}

export function useCreateTask() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: NewTask) => {
      if (!userId) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      scheduleTaskReminder(data);
      queryClient.invalidateQueries({ queryKey: tasksKey(userId) });
    },
  });
}

export function useUpdateTask() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: TaskUpdate }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (data) => {
      cancelTaskReminder(data.id);
      scheduleTaskReminder(data);
      queryClient.invalidateQueries({ queryKey: tasksKey(userId) });
    },
  });
}

/** Toggling completion on a recurring task also schedules its next
 * occurrence (Todoist-style) instead of materializing every future instance
 * up front. */
export function useToggleTaskCompletion() {
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();

  return (task: Task) => {
    const completing = !task.completed;
    updateTask.mutate({ id: task.id, patch: { completed: completing } });

    if (completing && task.recurrence !== "none" && task.due_date) {
      createTask.mutate({
        title: task.title,
        notes: task.notes ?? undefined,
        due_date: nextOccurrenceDate(task.due_date, task.recurrence),
        due_time: task.due_time ?? undefined,
        duration_minutes: task.duration_minutes ?? undefined,
        priority: task.priority,
        recurrence: task.recurrence,
      });
    }
  };
}

export function useDeleteTask() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      cancelTaskReminder(id);
      queryClient.invalidateQueries({ queryKey: tasksKey(userId) });
    },
  });
}
