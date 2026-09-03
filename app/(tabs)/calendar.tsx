import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Calendar, type DateData } from "react-native-calendars";
import type { MarkedDates } from "react-native-calendars/src/types";
import { Text, View, useColorScheme, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DayAgenda } from "@/components/DayAgenda";
import { DaySheet } from "@/components/DaySheet";
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
const WIDE_BREAKPOINT = 768;

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { width, height } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dayOpen, setDayOpen] = useState(false);

  const { data: counts = {} } = useTaskCountsByDate();
  const { data: dayTasks = [] } = useDayTasks(selectedDate);
  const { data: googleStatus } = useGoogleCalendarStatus();
  const { data: googleEvents = [], isFetching: loadingEvents } = useGoogleCalendarEvents(
    selectedDate,
    selectedDate,
    Boolean(googleStatus?.connected) && dayOpen
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
    setDayOpen(true);
  };

  const agenda = (
    <DayAgenda
      dateObj={dateObj}
      googleConnected={Boolean(googleStatus?.connected)}
      googleEvents={googleEvents}
      loadingEvents={loadingEvents}
      pending={pending}
      completed={completed}
      onCreateTask={(title, priority) => createTask.mutate({ title, due_date: selectedDate, priority })}
      onToggle={toggleTask}
      onDelete={removeTask}
      onCyclePriority={cycleTaskPriority}
      onClose={() => setDayOpen(false)}
    />
  );

  const calendarBlock = (
    <View className="px-5">
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-2">Calendar</Text>
      <Calendar
        current={selectedDate}
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={theme}
        enableSwipeMonths
      />
      {!dayOpen && (
        <Text className="mt-4 text-center text-sm text-ink-light/40 dark:text-ink-dark/40">
          Tap a day to see and add tasks
        </Text>
      )}
    </View>
  );

  if (isWide) {
    const panelHeight = Math.min(380, height * 0.42);
    return (
      <WideCalendarSplit
        insetsTop={insets.top}
        panelHeight={panelHeight}
        open={dayOpen}
        calendarBlock={calendarBlock}
        agenda={agenda}
      />
    );
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <View className="flex-1 justify-center">{calendarBlock}</View>
      <DaySheet visible={dayOpen} onClose={() => setDayOpen(false)}>
        {agenda}
      </DaySheet>
    </View>
  );
}

/** Wide-screen layout: calendar shrinks/slides up and the day panel slides
 * up from the bottom into the freed space -- no backdrop, both stay
 * interactive at once (unlike the phone's modal-style DaySheet). */
function WideCalendarSplit({
  insetsTop,
  panelHeight,
  open,
  calendarBlock,
  agenda,
}: {
  insetsTop: number;
  panelHeight: number;
  open: boolean;
  calendarBlock: React.ReactNode;
  agenda: React.ReactNode;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, { duration: 280 });
  }, [open, progress]);

  const calendarAnimStyle = useAnimatedStyle(() => ({
    paddingBottom: progress.value * panelHeight,
  }));

  const panelAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * (panelHeight + 40) }],
  }));

  return (
    <View className="flex-1" style={{ paddingTop: insetsTop }}>
      <Animated.View style={[{ flex: 1, justifyContent: "center" }, calendarAnimStyle]}>
        {calendarBlock}
      </Animated.View>

      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[
          { position: "absolute", left: 0, right: 0, bottom: 0, height: panelHeight },
          panelAnimStyle,
        ]}
      >
        <View className="flex-1 rounded-t-3xl border-t border-accent-900/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark-subtle overflow-hidden">
          {agenda}
        </View>
      </Animated.View>
    </View>
  );
}
