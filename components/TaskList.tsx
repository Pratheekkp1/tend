import { format } from "date-fns";
import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text } from "react-native";
import { TaskItem } from "./TaskItem";
import { isOverdue } from "@/lib/priority";
import { cycleRecurrence } from "@/lib/recurrence";
import { useUpdateTask } from "@/lib/tasks";
import type { Task } from "@/types/task";

interface RowLayout {
  top: number;
  height: number;
}

interface DragInfo {
  id: string;
  grantTop: number;
  tierStart: number;
  tierEnd: number;
  // Layout of the tier's rows at the moment the drag started, frozen for the
  // whole gesture. Comparing against *live* remeasured sibling positions
  // during the drag is unreliable: on web, onLayout is backed by a
  // ResizeObserver, which fires on size changes but doesn't reliably refire
  // for a row that only shifted position via a pure flex-reorder (no size
  // change) -- so after the first splice, later threshold checks would
  // compare against stale pre-drag positions for rows that had already
  // moved. A frozen snapshot plus the cumulative gesture delta sidesteps
  // that entirely: row heights don't change mid-drag, only their index does.
  tierLayout: { id: string; top: number; height: number }[];
}

export function TaskList({
  tasks,
  emptyLabel,
  showDueDate = false,
  onToggle,
  onDelete,
  onCyclePriority,
  onOpenDetail,
  onReorder,
}: {
  tasks: Task[];
  emptyLabel: string;
  showDueDate?: boolean;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
  onCyclePriority: (task: Task) => void;
  onOpenDetail?: (task: Task) => void;
  onReorder?: (orderedIds: string[]) => void;
}) {
  const todayISO = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const updateTask = useUpdateTask();

  const [workingTasks, setWorkingTasks] = useState<Task[]>(tasks);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragDy, setDragDy] = useState(0);
  const layoutRef = useRef<Record<string, RowLayout>>({});
  const dragInfoRef = useRef<DragInfo | null>(null);
  const draggingRef = useRef(false);
  const workingTasksRef = useRef<Task[]>(tasks);
  workingTasksRef.current = workingTasks;

  useEffect(() => {
    if (!draggingRef.current) setWorkingTasks(tasks);
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <View className="items-center justify-center py-16">
        <Text className="text-ink-light/45 dark:text-ink-dark/45 text-center">{emptyLabel}</Text>
      </View>
    );
  }

  if (!onReorder) {
    return (
      <View className="gap-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            overdue={isOverdue(task, todayISO)}
            showDueDate={showDueDate}
            onToggle={() => onToggle(task)}
            onDelete={() => onDelete(task)}
            onCyclePriority={() => onCyclePriority(task)}
            onCycleRecurrence={() =>
              updateTask.mutate({ id: task.id, patch: { recurrence: cycleRecurrence(task.recurrence) } })
            }
            onOpenDetail={onOpenDetail}
          />
        ))}
      </View>
    );
  }

  const handleDragGrant = (task: Task) => {
    const order = workingTasksRef.current;
    const index = order.findIndex((t) => t.id === task.id);
    if (index === -1) return;

    // Clamp to the contiguous run of tasks sharing this priority: crossing a
    // priority boundary would put `position` in a tier `compareTasks` never
    // consults it for (priority is compared first), so the drop would snap
    // back on the next refetch.
    let tierStart = index;
    while (tierStart > 0 && order[tierStart - 1].priority === task.priority) tierStart--;
    let tierEnd = index;
    while (tierEnd < order.length - 1 && order[tierEnd + 1].priority === task.priority) tierEnd++;

    const tierLayout = order.slice(tierStart, tierEnd + 1).map((t) => ({
      id: t.id,
      top: layoutRef.current[t.id]?.top ?? 0,
      height: layoutRef.current[t.id]?.height ?? 0,
    }));

    dragInfoRef.current = {
      id: task.id,
      grantTop: layoutRef.current[task.id]?.top ?? 0,
      tierStart,
      tierEnd,
      tierLayout,
    };
    draggingRef.current = true;
    setDraggingId(task.id);
    setDragDy(0);
  };

  const handleDragMove = (dy: number) => {
    const info = dragInfoRef.current;
    if (!info) return;
    setDragDy(dy);

    const draggedLayout = info.tierLayout.find((l) => l.id === info.id);
    if (!draggedLayout) return;
    const draggedCenter = info.grantTop + dy + draggedLayout.height / 2;

    // Which frozen (pre-drag) slot does the current finger position now
    // fall into -- last slot whose midpoint the dragged center has reached
    // or passed. Slot index maps 1:1 onto the tier's position within the
    // live array regardless of how many splices have already happened,
    // since splicing only reorders the same fixed set of tier ids.
    let targetPos = 0;
    for (let i = 0; i < info.tierLayout.length; i++) {
      const layout = info.tierLayout[i];
      if (draggedCenter >= layout.top + layout.height / 2) targetPos = i;
    }
    const targetIndex = info.tierStart + targetPos;

    setWorkingTasks((current) => {
      const currentIndex = current.findIndex((t) => t.id === info.id);
      if (currentIndex === -1 || targetIndex === currentIndex) return current;
      const next = [...current];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const handleDragRelease = () => {
    const info = dragInfoRef.current;
    draggingRef.current = false;
    dragInfoRef.current = null;
    setDraggingId(null);
    setDragDy(0);
    if (!info) return;

    const finalOrder = workingTasksRef.current;
    const draggedTask = finalOrder.find((t) => t.id === info.id);
    if (!draggedTask) return;
    const tierIds = finalOrder.filter((t) => t.priority === draggedTask.priority).map((t) => t.id);
    onReorder(tierIds);
  };

  return (
    <View className="gap-2">
      {workingTasks.map((task) => {
        const isDragging = draggingId === task.id;
        const currentTop = layoutRef.current[task.id]?.top ?? 0;
        const translateY =
          isDragging && dragInfoRef.current ? dragInfoRef.current.grantTop + dragDy - currentTop : 0;

        return (
          <View
            key={task.id}
            onLayout={(e) => {
              layoutRef.current[task.id] = { top: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height };
            }}
            style={
              isDragging
                ? { transform: [{ translateY }], opacity: 0.9, zIndex: 10, elevation: 4 }
                : undefined
            }
          >
            <TaskItem
              task={task}
              overdue={isOverdue(task, todayISO)}
              showDueDate={showDueDate}
              onToggle={() => onToggle(task)}
              onDelete={() => onDelete(task)}
              onCyclePriority={() => onCyclePriority(task)}
              onCycleRecurrence={() =>
                updateTask.mutate({ id: task.id, patch: { recurrence: cycleRecurrence(task.recurrence) } })
              }
              onOpenDetail={onOpenDetail}
              reorderable
              onDragGrant={() => handleDragGrant(task)}
              onDragMove={handleDragMove}
              onDragRelease={handleDragRelease}
            />
          </View>
        );
      })}
    </View>
  );
}
