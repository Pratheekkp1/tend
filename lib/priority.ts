import type { Priority, Task } from "@/types/task";

export const PRIORITY_ORDER: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  high: "#d64550",
  medium: "#e8a33d",
  low: "#a98da0",
  none: "transparent",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
  none: "No priority",
};

const PRIORITY_CYCLE: Priority[] = ["none", "low", "medium", "high"];

export function cyclePriority(current: Priority): Priority {
  const next = PRIORITY_CYCLE[(PRIORITY_CYCLE.indexOf(current) + 1) % PRIORITY_CYCLE.length];
  return next;
}

// Keywords that suggest a task is worth flagging by default. Whole-word,
// case-insensitive match against the title as the user types it.
const HIGH_PRIORITY_KEYWORDS = [
  "test",
  "tests",
  "quiz",
  "exam",
  "exams",
  "midterm",
  "midterms",
  "final",
  "finals",
  "deadline",
  "due",
  "interview",
  "presentation",
];

/** Returns the suggested priority for a task title based on keywords, or null if none matched. */
export function detectPriorityFromTitle(title: string): Priority | null {
  const words = title.toLowerCase().match(/[a-z']+/g);
  if (!words) return null;
  return words.some((w) => HIGH_PRIORITY_KEYWORDS.includes(w)) ? "high" : null;
}

/** Sort key: higher priority first, then earlier due date, then manual position, then creation order. */
export function compareTasks(a: Task, b: Task): number {
  const priorityDiff = PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
  if (priorityDiff !== 0) return priorityDiff;
  if (a.position !== b.position) return a.position - b.position;
  return a.created_at.localeCompare(b.created_at);
}

export function isOverdue(task: Task, todayISO: string): boolean {
  return !task.completed && Boolean(task.due_date) && (task.due_date as string) < todayISO;
}
