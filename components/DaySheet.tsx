import { useEffect } from "react";
import type { ReactNode } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/** A bottom sheet that slides up over the calendar. Swipe down or tap the
 * backdrop to dismiss. Plain absolutely-positioned overlay rather than RN's
 * Modal, which has focus/layout quirks on web. */
export function DaySheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { height } = useWindowDimensions();
  const sheetHeight = Math.max(height, 1) * 0.6;
  // Generously larger than sheetHeight so it's fully off-screen when closed
  // even though the sheet's own container (screen content minus the tab bar)
  // is shorter than the raw window height sheetHeight is computed from.
  const closedOffset = sheetHeight + 200;
  const translateY = useSharedValue(closedOffset);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : closedOffset, { duration: 240 });
  }, [visible, closedOffset, translateY]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 800) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(translateY.value / sheetHeight, 1),
  }));

  return (
    <View pointerEvents={visible ? "auto" : "none"} className="absolute inset-0 justify-end">
      <Animated.View style={[{ position: "absolute", inset: 0 }, backdropStyle]}>
        <Pressable className="absolute inset-0 bg-black/30" onPress={onClose} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ height: sheetHeight }, sheetStyle]}>
          <View className="flex-1 rounded-t-3xl bg-surface-light dark:bg-surface-dark-subtle overflow-hidden">
            <View className="items-center pt-3 pb-1">
              <View className="h-1.5 w-10 rounded-full bg-accent-900/15 dark:bg-white/15" />
            </View>
            <View className="flex-1">{children}</View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
