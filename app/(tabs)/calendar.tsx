import { Ionicons } from "@expo/vector-icons";
import { addDays, addWeeks, endOfWeek, format, isToday, parseISO, startOfWeek } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { Calendar, type DateData } from "react-native-calendars";
import type { MarkedDates } from "react-native-calendars/src/types";
import { Pressable, Text, View, useColorScheme, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CalendarTimeline, type TimelineDay } from "@/components/CalendarTimeline";
import { DayAgenda } from "@/components/DayAgenda";
import { DaySheet } from "@/components/DaySheet";
import { QuickAddInput } from "@/components/ui/QuickAddInput";
import { glassBlur } from "@/lib/glass";
import { useGoogleCalendarEvents, useGoogleCalendarStatus } from "@/lib/googleCalendar";
import { cyclePriority } from "@/lib/priority";
import {
  useCreateTask,
  useDayTasks,
  useDeleteTask,
  useTaskCountsByDate,
  useTasksInRange,
  useToggleTaskCompletion,
  useUpdateTask,
} from "@/lib/tasks";
import type { Task } from "@/types/task";

const ACCENT = "#f28482";
const WIDE_BREAKPOINT = 768;
type ViewMode = "month" | "week" | "day";

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const { width, height } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [dayOpen, setDayOpen] = useState(false);

  const dateObj = parseISO(selectedDate);
  const weekStart = startOfWeek(dateObj);
  const weekStartISO = format(weekStart, "yyyy-MM-dd");
  const weekEndISO = format(endOfWeek(dateObj), "yyyy-MM-dd");

  const { data: counts = {} } = useTaskCountsByDate();
  const { data: dayTasks = [] } = useDayTasks(selectedDate);
  const { data: weekTasks = [] } = useTasksInRange(weekStartISO, weekEndISO);
  const { data: googleStatus } = useGoogleCalendarStatus();
  const googleConnected = Boolean(googleStatus?.connected);

  const { data: googleEvents = [], isFetching: loadingEvents } = useGoogleCalendarEvents(
    selectedDate,
    selectedDate,
    googleConnected && (dayOpen || viewMode === "day")
  );
  const { data: weekGoogleEvents = [] } = useGoogleCalendarEvents(
    weekStartISO,
    weekEndISO,
    googleConnected && viewMode === "week"
  );

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleTask = useToggleTaskCompletion();

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
    dayTextColor: isDark ? "#f1efec" : "#33302c",
    monthTextColor: isDark ? "#f1efec" : "#33302c",
    textDisabledColor: isDark ? "#4d4e52" : "#c9c4bd",
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

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setDayOpen(true);
  };

  const header = (
    <View className="flex-row items-center justify-between px-5 pt-4 mb-2">
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">Calendar</Text>
      <ViewModeSwitch value={viewMode} onChange={setViewMode} />
    </View>
  );

  if (viewMode === "day") {
    const days: TimelineDay[] = [
      { dateISO: selectedDate, label: format(dateObj, "EEE d"), tasks: dayTasks, events: googleEvents },
    ];
    return (
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {header}
        <View className="flex-row items-center justify-between px-5 mb-2">
          <Text className="text-lg font-semibold text-ink-light dark:text-ink-dark">
            {isToday(dateObj) ? "Today" : format(dateObj, "EEEE, MMM d")}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setSelectedDate(format(addDays(dateObj, -1), "yyyy-MM-dd"))}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/70 dark:bg-white/10"
            >
              <Ionicons name="chevron-back" size={16} color="#c25553" />
            </Pressable>
            <Pressable
              onPress={() => setSelectedDate(format(addDays(dateObj, 1), "yyyy-MM-dd"))}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/70 dark:bg-white/10"
            >
              <Ionicons name="chevron-forward" size={16} color="#c25553" />
            </Pressable>
          </View>
        </View>
        <View className="px-5 mb-2">
          <QuickAddInput
            placeholder="Add a task for this day"
            onSubmit={(title, priority, dueTime, recurrence) =>
              createTask.mutate({ title, due_date: selectedDate, priority, due_time: dueTime, recurrence })
            }
          />
        </View>
        <CalendarTimeline days={days} onToggleTask={toggleTask} />
      </View>
    );
  }

  if (viewMode === "week") {
    const weekDays: TimelineDay[] = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(weekStart, i);
      const iso = format(d, "yyyy-MM-dd");
      return {
        dateISO: iso,
        label: format(d, "EEE d"),
        tasks: weekTasks.filter((t) => t.due_date === iso),
        events: weekGoogleEvents.filter((e) => e.start.slice(0, 10) === iso),
      };
    });
    return (
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {header}
        <View className="flex-row items-center justify-between px-5 mb-2">
          <Text className="text-lg font-semibold text-ink-light dark:text-ink-dark">
            {format(weekStart, "MMM d")} – {format(endOfWeek(dateObj), "MMM d, yyyy")}
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setSelectedDate(format(addWeeks(dateObj, -1), "yyyy-MM-dd"))}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/70 dark:bg-white/10"
            >
              <Ionicons name="chevron-back" size={16} color="#c25553" />
            </Pressable>
            <Pressable
              onPress={() => setSelectedDate(format(addWeeks(dateObj, 1), "yyyy-MM-dd"))}
              className="h-8 w-8 items-center justify-center rounded-full bg-white/70 dark:bg-white/10"
            >
              <Ionicons name="chevron-forward" size={16} color="#c25553" />
            </Pressable>
          </View>
        </View>
        <CalendarTimeline
          days={weekDays}
          onToggleTask={toggleTask}
          compact
        />
      </View>
    );
  }

  const agenda = (
    <DayAgenda
      dateObj={dateObj}
      googleConnected={googleConnected}
      googleEvents={googleEvents}
      loadingEvents={loadingEvents}
      pending={pending}
      completed={completed}
      onCreateTask={(title, priority, dueTime, recurrence) =>
        createTask.mutate({ title, due_date: selectedDate, priority, due_time: dueTime, recurrence })
      }
      onToggle={toggleTask}
      onDelete={removeTask}
      onCyclePriority={cycleTaskPriority}
      onClose={() => setDayOpen(false)}
    />
  );

  const calendarBlock = (
    <View className="px-5">
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
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        {header}
        <WideCalendarSplit
          panelHeight={panelHeight}
          open={dayOpen}
          calendarBlock={calendarBlock}
          agenda={agenda}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      {header}
      <View className="flex-1 justify-center">{calendarBlock}</View>
      <DaySheet visible={dayOpen} onClose={() => setDayOpen(false)}>
        {agenda}
      </DaySheet>
    </View>
  );
}

function ViewModeSwitch({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { key: ViewMode; label: string }[] = [
    { key: "month", label: "Month" },
    { key: "week", label: "Week" },
    { key: "day", label: "Day" },
  ];
  return (
    <View className="flex-row rounded-full bg-white/60 dark:bg-white/10 p-0.5">
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          onPress={() => onChange(opt.key)}
          className={`rounded-full px-3 py-1.5 ${value === opt.key ? "bg-accent-500" : ""}`}
        >
          <Text
            className={`text-xs font-medium ${
              value === opt.key ? "text-white" : "text-ink-light/60 dark:text-ink-dark/60"
            }`}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Wide-screen month layout: calendar shrinks/slides up and the day panel
 * slides up from the bottom into the freed space -- no backdrop, both stay
 * interactive at once (unlike the phone's modal-style DaySheet). */
function WideCalendarSplit({
  panelHeight,
  open,
  calendarBlock,
  agenda,
}: {
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
    <View className="flex-1">
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
        <View
          className="flex-1 rounded-t-3xl border-t border-black/5 dark:border-white/10 bg-surface-light dark:bg-surface-dark-subtle/85 overflow-hidden"
          style={glassBlur}
        >
          {agenda}
        </View>
      </Animated.View>
    </View>
  );
}
