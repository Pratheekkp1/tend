export type Priority = "none" | "low" | "medium" | "high";
export type Recurrence = "none" | "daily" | "weekly" | "biweekly" | "monthly";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  due_date: string | null; // "YYYY-MM-DD", null = general/backlog list
  due_time: string | null; // "HH:mm", 24-hour, null = no specific time
  duration_minutes: number | null; // for timeline block sizing; null when due_time is null
  completed: boolean;
  position: number;
  priority: Priority;
  recurrence: Recurrence;
  created_at: string;
  updated_at: string;
}

export type NewTask = Pick<Task, "title"> &
  Partial<
    Pick<
      Task,
      "notes" | "due_date" | "due_time" | "duration_minutes" | "position" | "priority" | "recurrence"
    >
  >;

export type TaskUpdate = Partial<
  Pick<
    Task,
    | "title"
    | "notes"
    | "due_date"
    | "due_time"
    | "duration_minutes"
    | "completed"
    | "position"
    | "priority"
    | "recurrence"
  >
>;

export interface Subtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime, or "YYYY-MM-DD" for all-day
  end: string;
  allDay: boolean;
  htmlLink?: string;
}
