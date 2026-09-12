import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
import { Animated, PanResponder, Pressable, Text, View } from "react-native";
import { Checkbox } from "./ui/Checkbox";
import { PRIORITY_COLOR, PRIORITY_LABEL } from "@/lib/priority";
import { RECURRENCE_LABEL } from "@/lib/recurrence";
import { useSubtaskCounts } from "@/lib/subtasks";
import { useAllTaskTags } from "@/lib/tags";
import { formatTime12h } from "@/lib/time";
import type { Task } from "@/types/task";

const SWIPE_CLAMP = 90;
const SWIPE_COMMIT_THRESHOLD = 75;

export function TaskItem({
  task,
  overdue = false,
  showDueDate = false,
  onToggle,
  onDelete,
  onCyclePriority,
  onCycleRecurrence,
  onOpenDetail,
  reorderable = false,
  onDragGrant,
  onDragMove,
  onDragRelease,
}: {
  task: Task;
  overdue?: boolean;
  showDueDate?: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onCyclePriority: () => void;
  onCycleRecurrence?: () => void;
  onOpenDetail?: (task: Task) => void;
  reorderable?: boolean;
  onDragGrant?: () => void;
  onDragMove?: (dy: number) => void;
  onDragRelease?: () => void;
}) {
  const { data: subtaskCounts } = useSubtaskCounts();
  const subtaskProgress = subtaskCounts?.[task.id];
  const hasSubtasks = Boolean(subtaskProgress && subtaskProgress.total > 0);

  const { data: taskTags } = useAllTaskTags();
  const tags = taskTags?.[task.id] ?? [];

  const hasMeta =
    task.notes ||
    (showDueDate && task.due_date) ||
    overdue ||
    task.due_time ||
    task.recurrence !== "none" ||
    hasSubtasks ||
    tags.length > 0;

  const dragResponder = reorderable
    ? PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => onDragGrant?.(),
        onPanResponderMove: (_e, gestureState) => onDragMove?.(gestureState.dy),
        onPanResponderRelease: () => onDragRelease?.(),
        onPanResponderTerminate: () => onDragRelease?.(),
      })
    : null;

  // RN core's Animated, not react-native-reanimated -- reanimated's Animated.View
  // has real prop/DOM gaps on web (see the panHandlers comment below, and a second,
  // separate issue where useAnimatedStyle-driven styles from a PanResponder-driven
  // shared value silently never reached the DOM despite the value itself updating
  // correctly), both only surfacing once multiple Animated.Views coexist in one
  // component the way this one needs. RN's classic Animated API doesn't have either
  // problem and needs no reanimated-specific debugging to trust.
  const translateX = useRef(new Animated.Value(0)).current;
  // On web, Pressable's onPress fires from the native `click` event rather than
  // through the responder system (react-native-web's PressResponder does this
  // deliberately), so stealing the gesture mid-drag doesn't stop the title/
  // checkbox/icon Pressables underneath from also firing a click on release.
  // This flag -- true only while a real (past-threshold-to-claim) swipe is
  // active -- lets a capturing click handler swallow that phantom press.
  const didSwipeRef = useRef(false);

  const isHorizontalSwipe = (_e: unknown, gestureState: { dx: number; dy: number }) =>
    Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2 && Math.abs(gestureState.dx) > 10;

  const snapBack = () => {
    Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    setTimeout(() => {
      didSwipeRef.current = false;
    }, 0);
  };

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        // The row's title/checkbox/icons are Pressables, which claim the
        // touch responder for themselves as soon as it starts (bubble
        // phase), so a bubble-phase onMoveShouldSetPanResponder here would
        // never get a turn once a touch begins on top of one of them --
        // which is most of the row's surface. The *Capture variant is
        // checked top-down before any child's bubble-phase claim finalizes,
        // so a clearly-horizontal move can still intercept the gesture no
        // matter what's underneath the finger.
        onMoveShouldSetPanResponderCapture: isHorizontalSwipe,
        onMoveShouldSetPanResponder: isHorizontalSwipe,
        onPanResponderGrant: () => {
          didSwipeRef.current = true;
        },
        onPanResponderMove: (_e, gestureState) => {
          translateX.setValue(Math.max(-SWIPE_CLAMP, Math.min(SWIPE_CLAMP, gestureState.dx)));
        },
        onPanResponderRelease: (_e, gestureState) => {
          const dx = gestureState.dx;
          if (dx > SWIPE_COMMIT_THRESHOLD) onToggle();
          else if (dx < -SWIPE_COMMIT_THRESHOLD) onDelete();
          snapBack();
        },
        onPanResponderTerminate: snapBack,
      }),
    [onToggle, onDelete, translateX, snapBack],
  );

  // react-native-web's View doesn't forward `onClickCapture` (it isn't in its
  // prop allowlist), and a bubble-phase `onClick` on this wrapper would fire
  // too late -- the nested Pressable's own click already ran by then. Attach
  // a real capture-phase DOM listener instead, which runs before any
  // descendant's click handler. No-ops on native (no `addEventListener`).
  const rowRef = useRef<View>(null);
  useEffect(() => {
    const node = rowRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== "function") return;
    const swallowIfSwiped = (e: Event) => {
      if (didSwipeRef.current) {
        e.stopPropagation();
        e.preventDefault();
      }
    };
    node.addEventListener("click", swallowIfSwiped, true);
    return () => node.removeEventListener("click", swallowIfSwiped, true);
  }, []);

  const completeOpacity = translateX.interpolate({
    inputRange: [0, SWIPE_COMMIT_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const deleteOpacity = translateX.interpolate({
    inputRange: [-SWIPE_COMMIT_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View className="relative">
      <Animated.View pointerEvents="none" style={{ position: "absolute", inset: 0, opacity: completeOpacity }}>
        <View className="flex-1 rounded-xl bg-sage-500 flex-row items-center px-5">
          <Ionicons name="checkmark-circle" size={24} color="white" />
        </View>
      </Animated.View>
      <Animated.View pointerEvents="none" style={{ position: "absolute", inset: 0, opacity: deleteOpacity }}>
        <View className="flex-1 rounded-xl bg-red-500 flex-row items-center justify-end px-5">
          <Ionicons name="trash" size={22} color="white" />
        </View>
      </Animated.View>
      {/* panHandlers go on the plain View, not this Animated.View -- an
       * Animated.View here only ever needs the transform style, and keeping
       * responder props off it avoids relying on however well *this*
       * Animated implementation forwards non-style props to the DOM node. */}
      <Animated.View style={{ transform: [{ translateX }] }}>
        <View
          ref={rowRef}
          {...swipeResponder.panHandlers}
          className={`flex-row items-center gap-3 rounded-xl bg-white/70 dark:bg-surface-dark-subtle/70 px-4 py-3 border ${
            overdue ? "border-accent-500/40" : "border-accent-900/5 dark:border-white/5"
          }`}
        >
          {reorderable && (
            <View {...(dragResponder ? dragResponder.panHandlers : {})} hitSlop={8} className="p-1 -ml-1">
              <Ionicons name="reorder-three-outline" size={18} color="#cbb9ad" />
            </View>
          )}
          <Checkbox checked={task.completed} onToggle={onToggle} />
          <Pressable
            onPress={() => onOpenDetail?.(task)}
            disabled={!onOpenDetail}
            className="flex-1"
          >
            <Text
              className={`text-base ${
                task.completed
                  ? "text-ink-light/35 dark:text-ink-dark/35 line-through"
                  : "text-ink-light dark:text-ink-dark"
              }`}
            >
              {task.title}
            </Text>
            {hasMeta && (
              <View className="mt-0.5 flex-row items-center gap-2">
                {overdue && (
                  <Text className="text-xs font-semibold text-accent-700 dark:text-accent-300">Overdue</Text>
                )}
                {showDueDate && task.due_date && !overdue ? (
                  <Text className="text-xs text-ink-light/45 dark:text-ink-dark/45">
                    {format(parseISO(task.due_date), "MMM d")}
                  </Text>
                ) : null}
                {task.due_time && (
                  <Text className="text-xs text-gold-700">{formatTime12h(task.due_time)}</Text>
                )}
                {task.recurrence !== "none" && (
                  <Ionicons name="repeat" size={12} color="#5f7d76" />
                )}
                {hasSubtasks && (
                  <Text className="text-xs text-ink-light/45 dark:text-ink-dark/45">
                    {subtaskProgress!.done}/{subtaskProgress!.total}
                  </Text>
                )}
                {tags.length > 0 && (
                  <View className="flex-row items-center gap-1.5">
                    {tags.map((tag) => (
                      <View key={tag.id} className="flex-row items-center gap-1">
                        <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
                        <Text className="text-xs text-ink-light/45 dark:text-ink-dark/45">{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {task.notes ? (
                  <Text className="text-sm text-ink-light/45 dark:text-ink-dark/45 flex-1" numberOfLines={1}>
                    {task.notes}
                  </Text>
                ) : null}
              </View>
            )}
          </Pressable>
          {onCycleRecurrence && (
            <Pressable
              onPress={onCycleRecurrence}
              hitSlop={8}
              className="p-1"
              accessibilityLabel={RECURRENCE_LABEL[task.recurrence]}
            >
              <Ionicons
                name={task.recurrence === "none" ? "repeat-outline" : "repeat"}
                size={17}
                color={task.recurrence === "none" ? "#cbb9ad" : "#84a59d"}
              />
            </Pressable>
          )}
          <Pressable
            onPress={onCyclePriority}
            hitSlop={8}
            className="p-1"
            accessibilityLabel={PRIORITY_LABEL[task.priority]}
          >
            <Ionicons
              name={task.priority === "none" ? "flag-outline" : "flag"}
              size={17}
              color={task.priority === "none" ? "#cbb9ad" : PRIORITY_COLOR[task.priority]}
            />
          </Pressable>
          <Pressable onPress={onDelete} hitSlop={8} className="p-1">
            <Ionicons name="trash-outline" size={18} color="#b0a08f" />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}
