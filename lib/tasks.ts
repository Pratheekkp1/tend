import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from "./auth-context";
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
  return { data: data?.filter((t) => !t.due_date), ...rest };
}

export function useDayTasks(date: string) {
  const { data, ...rest } = useAllTasks();
  return { data: data?.filter((t) => t.due_date === date), ...rest };
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(userId) }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(userId) }),
  });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey(userId) }),
  });
}
