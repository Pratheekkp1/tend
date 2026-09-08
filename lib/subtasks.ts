import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { supabase } from "./supabase";
import type { Subtask } from "@/types/task";

const subtasksKey = (taskId: string | undefined) => ["subtasks", taskId] as const;
const allSubtasksKey = (userId: string | undefined) => ["subtasks", "all", userId] as const;

async function fetchSubtasks(taskId: string): Promise<Subtask[]> {
  const { data, error } = await supabase
    .from("subtasks")
    .select("*")
    .eq("task_id", taskId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: subtasksKey(taskId),
    queryFn: () => fetchSubtasks(taskId),
    enabled: Boolean(taskId),
  });
}

async function fetchAllSubtasks(userId: string): Promise<Subtask[]> {
  const { data, error } = await supabase.from("subtasks").select("*").eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}

/** Loads every subtask for the signed-in user once, reduced client-side --
 * mirrors useTaskCountsByDate in lib/tasks.ts. */
function useAllSubtasks() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: allSubtasksKey(userId),
    queryFn: () => fetchAllSubtasks(userId as string),
    enabled: Boolean(userId),
  });
}

/** Maps taskId -> { done, total }, for the subtask progress badge on TaskItem. */
export function useSubtaskCounts() {
  const { data, ...rest } = useAllSubtasks();
  const counts: Record<string, { done: number; total: number }> = {};
  for (const subtask of data ?? []) {
    const entry = counts[subtask.task_id] ?? { done: 0, total: 0 };
    entry.total += 1;
    if (subtask.completed) entry.done += 1;
    counts[subtask.task_id] = entry;
  }
  return { data: counts, ...rest };
}

export function useCreateSubtask() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ task_id, title }: { task_id: string; title: string }) => {
      if (!userId) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("subtasks")
        .insert({ task_id, title, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as Subtask;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks"] }),
  });
}

export function useToggleSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subtask: Subtask) => {
      const { data, error } = await supabase
        .from("subtasks")
        .update({ completed: !subtask.completed })
        .eq("id", subtask.id)
        .select()
        .single();
      if (error) throw error;
      return data as Subtask;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks"] }),
  });
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subtasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subtasks"] }),
  });
}
