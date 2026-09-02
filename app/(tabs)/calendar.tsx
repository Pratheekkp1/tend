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
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QuickAddInput } from "@/components/ui/QuickAddInput";
import { TaskList } from "@/components/TaskList";
import { useGoogleCalendarEvents, useGoogleCalendarStatus } from "@/lib/googleCalendar";
import {
  useCreateTask,
  useDayTasks,
  useDeleteTask,
  useTaskCountsByDate,
  useUpdateTask,
} from "@/lib/tasks";
import type { Task } from "@/types/task";

const ACCENT = "#4c65f7";

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const { data: counts = {} } = useTaskCountsByDate();
  const { data: dayTasks = [] } = useDayTasks(selectedDate);
  const { data: googleStatus } = useGoogleCalendarStatus();
  const { data: googleEvents = [], isFetching: loadingEvents } = useGoogleCalendarEvents(
    selectedDate,
    selectedDate,
    Boolean(googleStatus?.connected)
  );

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

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
    dayTextColor: isDark ? "#f3f4f6" : "#111827",
    monthTextColor: isDark ? "#f3f4f6" : "#111827",
    textDisabledColor: isDark ? "#4b5563" : "#d1d5db",
    todayTextColor: ACCENT,
    arrowColor: ACCENT,
    selectedDayBackgroundColor: ACCENT,
    selectedDayTextColor: "#ffffff",
    textSectionTitleColor: isDark ? "#9ca3af" : "#6b7280",
  };

  const pending = dayTasks.filter((t) => !t.completed);
  const completed = dayTasks.filter((t) => t.completed);
  const dateObj = parseISO(selectedDate);

  const dayPanelContent = (
    <View className={`px-5 pb-8 ${isWide ? "pt-6" : "pt-2"}`}>
      <Text className="text-lg font-bold text-gray-900 dark:text-white">
        {format(dateObj, "EEEE, MMMM d")}
      </Text>

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
                  <Text className="text-sm font-medium text-gray-900 dark:text-white">
                    {event.title}
                  </Text>
                  {!event.allDay && (
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
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
          onSubmit={(title) => createTask.mutate({ title, due_date: selectedDate })}
        />
      </View>

      <View className="mt-5">
        <TaskList
          tasks={pending}
          emptyLabel="Nothing scheduled."
          onToggle={(task: Task) =>
            updateTask.mutate({ id: task.id, patch: { completed: !task.completed } })
          }
          onDelete={(task: Task) => deleteTask.mutate(task.id)}
        />
      </View>

      {completed.length > 0 && (
        <View className="mt-5">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Completed
          </Text>
          <TaskList
            tasks={completed}
            emptyLabel=""
            onToggle={(task: Task) =>
              updateTask.mutate({ id: task.id, patch: { completed: !task.completed } })
            }
            onDelete={(task: Task) => deleteTask.mutate(task.id)}
          />
        </View>
      )}
    </View>
  );

  const onDayPress = (day: DateData) => setSelectedDate(day.dateString);

  if (isWide) {
    return (
      <View className="flex-1 flex-row" style={{ paddingTop: insets.top }}>
        <View className="w-[380px] border-r border-gray-200 dark:border-white/10 px-5 pt-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Calendar</Text>
          <Calendar
            current={selectedDate}
            onDayPress={onDayPress}
            markedDates={markedDates}
            theme={theme}
            enableSwipeMonths
          />
        </View>
        <ScrollView className="flex-1">{dayPanelContent}</ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={{ paddingTop: insets.top }} className="flex-1">
      <View className="px-5 pt-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Calendar</Text>
        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          markedDates={markedDates}
          theme={theme}
          enableSwipeMonths
        />
      </View>
      {dayPanelContent}
    </ScrollView>
  );
}
