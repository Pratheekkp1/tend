export type Priority = "none" | "low" | "medium" | "high";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  due_date: string | null; // "YYYY-MM-DD", null = general/backlog list
  completed: boolean;
  position: number;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export type NewTask = Pick<Task, "title"> &
  Partial<Pick<Task, "notes" | "due_date" | "position" | "priority">>;

export type TaskUpdate = Partial<
  Pick<Task, "title" | "notes" | "due_date" | "completed" | "position" | "priority">
>;

export interface GoogleCalendarEvent {
  id: string;
  title: string;
  start: string; // ISO datetime, or "YYYY-MM-DD" for all-day
  end: string;
  allDay: boolean;
  htmlLink?: string;
}
