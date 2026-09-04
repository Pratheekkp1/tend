import { addDays, addMonths, addWeeks, format, parseISO } from "date-fns";
import type { Recurrence } from "@/types/task";

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: "Does not repeat",
  daily: "Repeats daily",
  weekly: "Repeats weekly",
  biweekly: "Repeats every 2 weeks",
  monthly: "Repeats monthly",
};

export const RECURRENCE_SHORT_LABEL: Record<Recurrence, string> = {
  none: "",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

const RECURRENCE_CYCLE: Recurrence[] = ["none", "daily", "weekly", "biweekly", "monthly"];

export function cycleRecurrence(current: Recurrence): Recurrence {
  return RECURRENCE_CYCLE[(RECURRENCE_CYCLE.indexOf(current) + 1) % RECURRENCE_CYCLE.length];
}

/** Given the date a recurring task was just completed on, returns the "YYYY-MM-DD"
 * for its next occurrence. */
export function nextOccurrenceDate(dueDateISO: string, recurrence: Recurrence): string {
  const date = parseISO(dueDateISO);
  const next =
    recurrence === "daily"
      ? addDays(date, 1)
      : recurrence === "weekly"
        ? addWeeks(date, 1)
        : recurrence === "biweekly"
          ? addWeeks(date, 2)
          : recurrence === "monthly"
            ? addMonths(date, 1)
            : date;
  return format(next, "yyyy-MM-dd");
}
