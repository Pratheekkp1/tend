import { Ionicons } from "@expo/vector-icons";
import { format, isToday, parseISO } from "date-fns";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { PRIORITY_COLOR } from "@/lib/priority";
import { formatTime12h } from "@/lib/time";
import type { GoogleCalendarEvent, Task } from "@/types/task";

const HOUR_START = 6;
const HOUR_END = 22; // last labeled hour (10 PM); grid extends slightly past it
const ROW_HEIGHT = 52;
const GRID_HEIGHT = (HOUR_END - HOUR_START + 1) * ROW_HEIGHT;
const GOOGLE_BLOCK_COLOR = "#84a59d";

export interface TimelineDay {
  dateISO: string;
  label: string;
  tasks: Task[];
  events: GoogleCalendarEvent[];
}

function minutesFromMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function blockTop(startMinutes: number): number {
  return ((startMinutes - HOUR_START * 60) / 60) * ROW_HEIGHT;
}

/** Shared hour-grid used by both Day view (one column) and Week view (seven). */
export function CalendarTimeline({
  days,
  onToggleTask,
  compact = false,
}: {
  days: TimelineDay[];
  onToggleTask: (task: Task) => void;
  compact?: boolean;
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-8">
      {/* All-day / untimed strip */}
      <View className="flex-row border-b border-accent-900/10 dark:border-white/10 px-2 pb-2 pt-1">
        <View style={{ width: compact ? 44 : 56 }} className="items-end pr-2 pt-1">
          <Text className="text-[10px] text-ink-light/40 dark:text-ink-dark/40">All day</Text>
        </View>
        <View className="flex-1 flex-row">
          {days.map((day) => {
            const untimed = day.tasks.filter((t) => !t.due_time);
            const allDayEvents = day.events.filter((e) => e.allDay);
            return (
              <View key={day.dateISO} className="flex-1 gap-1 px-1">
                {allDayEvents.map((e) => (
                  <View key={e.id} className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: `${GOOGLE_BLOCK_COLOR}30` }}>
                    <Text numberOfLines={1} className="text-[10px] text-ink-light dark:text-ink-dark">
                      {e.title}
                    </Text>
                  </View>
                ))}
                {untimed.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => onToggleTask(t)}
                    className="rounded-md px-1.5 py-0.5"
                    style={{ backgroundColor: `${PRIORITY_COLOR[t.priority] === "transparent" ? "#c9a08f" : PRIORITY_COLOR[t.priority]}30` }}
                  >
                    <Text
                      numberOfLines={1}
                      className={`text-[10px] ${t.completed ? "line-through text-ink-light/40 dark:text-ink-dark/40" : "text-ink-light dark:text-ink-dark"}`}
                    >
                      {t.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            );
          })}
        </View>
      </View>

      {/* Day headers, for week view */}
      {days.length > 1 && (
        <View className="flex-row px-2 py-2">
          <View style={{ width: compact ? 44 : 56 }} />
          <View className="flex-1 flex-row">
            {days.map((day) => (
              <View key={day.dateISO} className="flex-1 items-center">
                <Text
                  className={`text-xs font-semibold ${
                    isToday(parseISO(day.dateISO)) ? "text-accent-600 dark:text-accent-300" : "text-ink-light/60 dark:text-ink-dark/60"
                  }`}
                >
                  {day.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Hour grid */}
      <View className="flex-row px-2" style={{ height: GRID_HEIGHT }}>
        <View style={{ width: compact ? 44 : 56 }}>
          {hours.map((h) => (
            <View key={h} style={{ height: ROW_HEIGHT }} className="items-end pr-2">
              <Text className="text-[10px] text-ink-light/40 dark:text-ink-dark/40 -mt-1.5">
                {format(new Date(2000, 0, 1, h), "h a")}
              </Text>
            </View>
          ))}
        </View>

        <View className="flex-1 flex-row" style={{ height: GRID_HEIGHT }}>
          {days.map((day) => (
            <View key={day.dateISO} className="flex-1 border-l border-accent-900/5 dark:border-white/5 relative">
              {hours.map((h) => (
                <View
                  key={h}
                  style={{ position: "absolute", top: (h - HOUR_START) * ROW_HEIGHT, left: 0, right: 0 }}
                  className="border-t border-accent-900/5 dark:border-white/5"
                />
              ))}

              {day.events
                .filter((e) => !e.allDay)
                .map((event) => {
                  const start = new Date(event.start);
                  const end = new Date(event.end);
                  const startMin = start.getHours() * 60 + start.getMinutes();
                  const durationMin = Math.max(20, (end.getTime() - start.getTime()) / 60000);
                  return (
                    <Pressable
                      key={event.id}
                      onPress={() => event.htmlLink && Linking.openURL(event.htmlLink)}
                      style={{
                        position: "absolute",
                        top: blockTop(startMin),
                        left: 2,
                        right: 2,
                        height: Math.max(20, (durationMin / 60) * ROW_HEIGHT),
                        backgroundColor: `${GOOGLE_BLOCK_COLOR}25`,
                        borderLeftColor: GOOGLE_BLOCK_COLOR,
                      }}
                      className="rounded-md border-l-2 px-1.5 py-0.5 overflow-hidden"
                    >
                      <Text numberOfLines={2} className="text-[10px] font-medium text-ink-light dark:text-ink-dark">
                        {event.title}
                      </Text>
                    </Pressable>
                  );
                })}

              {day.tasks
                .filter((t) => t.due_time)
                .map((task) => {
                  const startMin = minutesFromMidnight(task.due_time as string);
                  const durationMin = task.duration_minutes ?? 60;
                  const color = PRIORITY_COLOR[task.priority] === "transparent" ? "#c9a08f" : PRIORITY_COLOR[task.priority];
                  return (
                    <Pressable
                      key={task.id}
                      onPress={() => onToggleTask(task)}
                      style={{
                        position: "absolute",
                        top: blockTop(startMin),
                        left: 2,
                        right: 2,
                        height: Math.max(20, (durationMin / 60) * ROW_HEIGHT),
                        backgroundColor: `${color}25`,
                        borderLeftColor: color,
                      }}
                      className="rounded-md border-l-2 px-1.5 py-0.5 overflow-hidden"
                    >
                      <View className="flex-row items-center gap-1">
                        {task.completed && <Ionicons name="checkmark" size={10} color={color} />}
                        <Text
                          numberOfLines={2}
                          className={`text-[10px] font-medium ${
                            task.completed ? "line-through text-ink-light/40 dark:text-ink-dark/40" : "text-ink-light dark:text-ink-dark"
                          }`}
                        >
                          {task.title}
                        </Text>
                      </View>
                      {!compact && (
                        <Text className="text-[9px] text-ink-light/50 dark:text-ink-dark/50">
                          {formatTime12h(task.due_time as string)}
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
