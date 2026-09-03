import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { Calendar, type DateData } from "react-native-calendars";
import type { MarkedDates } from "react-native-calendars/src/types";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DaySheet } from "@/components/DaySheet";
import { QuickAddInput } from "@/components/ui/QuickAddInput";
import { TaskList } from "@/components/TaskList";
import { useGoogleCalendarEvents, useGoogleCalendarStatus } from "@/lib/googleCalendar";
import { cyclePriority } from "@/lib/priority";
import {
  useCreateTask,
  useDayTasks,
  useDeleteTask,
  useTaskCountsByDate,
  useUpdateTask,
} from "@/lib/tasks";
import type { Task } from "@/types/task";

const ACCENT = "#f28482";

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: counts = {} } = useTaskCountsByDate();
  const { data: dayTasks = [] } = useDayTasks(selectedDate);
  const { data: googleStatus } = useGoogleCalendarStatus();
  const { data: googleEvents = [], isFetching: loadingEvents } = useGoogleCalendarEvents(
    selectedDate,
    selectedDate,
    Boolean(googleStatus?.connected) && sheetOpen
  );

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const toggleTask = (task: Task) =>
    updateTask.mutate({ id: task.id, patch: { completed: !task.completed } });
  const removeTask = (task: Task) => deleteTask.mutate(task.id);
  const cycleTaskPriority = (task: Task) =>
    updateTask.mutate({ id: task.id, patch: { priority: cyclePriority(task.priority) } });

  const markedDates: MarkedDates = useMemo(() => {
    const marks: MarkedDates = {};
    for (const date of Object.keys(counts)) {
      marks[date] = { marked: true, dotColor: ACCENT };
    }
    marks[selectedDate] = {
      ...marks[selectedDate],
      selected: true,
      selectedColor: ACCENT,
    };
    return marks;
  }, [counts, selectedDate]);

  const theme = {
    calendarBackground: "transparent",
    dayTextColor: isDark ? "#f7ede2" : "#4a3f37",
    monthTextColor: isDark ? "#f7ede2" : "#4a3f37",
    // Kept clearly legible (not just faint) so adjacent-month days don't read as missing.
    textDisabledColor: isDark ? "#6b5c4f" : "#c4a58f",
    todayTextColor: ACCENT,
    todayBackgroundColor: isDark ? "rgba(242,132,130,0.2)" : "rgba(242,132,130,0.14)",
    arrowColor: ACCENT,
    selectedDayBackgroundColor: ACCENT,
    selectedDayTextColor: "#ffffff",
    textSectionTitleColor: isDark ? "#f59d97" : "#c25553",
    "stylesheet.calendar.header": {
      dayTextAtIndex0: { color: isDark ? "#f59d97" : "#c25553" },
      dayTextAtIndex6: { color: isDark ? "#f59d97" : "#c25553" },
    },
  };

  const pending = dayTasks.filter((t) => !t.completed);
  const completed = dayTasks.filter((t) => t.completed);
  const dateObj = parseISO(selectedDate);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setSheetOpen(true);
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <View className="flex-1 justify-center px-5">
        <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-2">Calendar</Text>
        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          theme={theme}
          enableSwipeMonths
        />
        <Text className="mt-4 text-center text-sm text-ink-light/40 dark:text-ink-dark/40">
          Tap a day to see and add tasks
        </Text>
      </View>

      <DaySheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-8"
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-bold text-ink-light dark:text-ink-dark">
              {format(dateObj, "EEEE, MMMM d")}
            </Text>
            <Pressable onPress={() => setSheetOpen(false)} hitSlop={8} className="p-1">
              <Ionicons name="close" size={20} color="#c9a08f" />
            </Pressable>
          </View>

          {googleStatus?.connected && (
            <View className="mt-4 gap-2">
              {loadingEvents ? (
                <ActivityIndicator size="small" />
              ) : googleEvents.length > 0 ? (
                googleEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() => event.htmlLink && Linking.openURL(event.htmlLink)}
                    className="flex-row items-center gap-2 rounded-xl border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-500/10 px-3 py-2.5"
                  >
                    <Ionicons name="calendar-clear-outline" size={16} color={ACCENT} />
                    <View className="flex-1">
                      <Text className="text-sm font-medium text-ink-light dark:text-ink-dark">
                        {event.title}
                      </Text>
                      {!event.allDay && (
                        <Text className="text-xs text-ink-light/55 dark:text-ink-dark/55">
                          {format(new Date(event.start), "h:mm a")} –{" "}
                          {format(new Date(event.end), "h:mm a")}
                        </Text>
                      )}
                    </View>
                  </Pressable>
                ))
              ) : null}
            </View>
          )}

          <View className="mt-5">
            <QuickAddInput
              placeholder="Add a task for this day"
              onSubmit={(title, priority) =>
                createTask.mutate({ title, due_date: selectedDate, priority })
              }
            />
          </View>

          <View className="mt-5">
            <TaskList
              tasks={pending}
              emptyLabel="Nothing scheduled."
              onToggle={toggleTask}
              onDelete={removeTask}
              onCyclePriority={cycleTaskPriority}
            />
          </View>

          {completed.length > 0 && (
            <View className="mt-5">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-light/45 dark:text-ink-dark/45">
                Completed
              </Text>
              <TaskList
                tasks={completed}
                emptyLabel=""
                onToggle={toggleTask}
                onDelete={removeTask}
                onCyclePriority={cycleTaskPriority}
              />
            </View>
          )}
        </ScrollView>
      </DaySheet>
    </View>
  );
}
