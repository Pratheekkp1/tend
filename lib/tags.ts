import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./auth-context";
import { supabase } from "./supabase";
import type { Tag } from "@/types/task";

const tagsKey = (userId: string | undefined) => ["tags", userId] as const;
const taskTagsKey = (taskId: string | undefined) => ["task_tags", taskId] as const;
const allTaskTagsKey = (userId: string | undefined) => ["task_tags", "all", userId] as const;

async function fetchTags(userId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export function useTags() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: tagsKey(userId),
    queryFn: () => fetchTags(userId as string),
    enabled: Boolean(userId),
  });
}

export function useCreateTag() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (!userId) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("tags")
        .insert({ name, color, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as Tag;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
      queryClient.invalidateQueries({ queryKey: ["task_tags"] });
    },
  });
}

// Shape of a `task_tags` row selected with its parent `tags` row embedded
// via Supabase's FK-based nested select (task_tags.tag_id -> tags.id).
interface TaskTagJoinRow {
  tag_id: string;
  tags: Tag | null;
}

async function fetchTaskTags(taskId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("task_tags")
    .select("tag_id, tags(id, user_id, name, color, created_at)")
    .eq("task_id", taskId);

  if (error) throw error;
  // Without generated Database types, postgrest-js can't see the FK's
  // cardinality and infers `tags` as an array; at runtime PostgREST embeds
  // the many-to-one side (task_tags.tag_id -> tags.id) as a single object.
  return ((data ?? []) as unknown as TaskTagJoinRow[]).flatMap((row) => (row.tags ? [row.tags] : []));
}

/** The tag rows currently assigned to one task, for the TaskDetailModal tag picker. */
export function useTaskTags(taskId: string) {
  return useQuery({
    queryKey: taskTagsKey(taskId),
    queryFn: () => fetchTaskTags(taskId),
    enabled: Boolean(taskId),
  });
}

interface AllTaskTagsJoinRow {
  task_id: string;
  tags: Tag | null;
}

async function fetchAllTaskTags(userId: string): Promise<AllTaskTagsJoinRow[]> {
  const { data, error } = await supabase
    .from("task_tags")
    .select("task_id, tags(id, user_id, name, color, created_at)")
    .eq("user_id", userId);

  if (error) throw error;
  // Same array-vs-object cardinality caveat as fetchTaskTags above.
  return (data ?? []) as unknown as AllTaskTagsJoinRow[];
}

/** Loads every task_tags row (with its tag) for the signed-in user once,
 * reduced client-side -- mirrors useAllSubtasks in lib/subtasks.ts. */
function useAllTaskTagsRaw() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: allTaskTagsKey(userId),
    queryFn: () => fetchAllTaskTags(userId as string),
    enabled: Boolean(userId),
  });
}

/** Maps taskId -> assigned Tag[], for rendering tag pills on TaskItem list
 * rows and filtering the Todos list without N+1 queries. */
export function useAllTaskTags() {
  const { data, ...rest } = useAllTaskTagsRaw();
  const byTask: Record<string, Tag[]> = {};
  for (const row of data ?? []) {
    if (!row.tags) continue;
    (byTask[row.task_id] ??= []).push(row.tags);
  }
  return { data: byTask, ...rest };
}

export function useAssignTag() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ task_id, tag_id }: { task_id: string; tag_id: string }) => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("task_tags").insert({ task_id, tag_id, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task_tags"] }),
  });
}

export function useUnassignTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ task_id, tag_id }: { task_id: string; tag_id: string }) => {
      const { error } = await supabase
        .from("task_tags")
        .delete()
        .eq("task_id", task_id)
        .eq("tag_id", tag_id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task_tags"] }),
  });
}
