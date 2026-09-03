import { useEffect, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const PETAL_COLORS = ["#ffc2d6", "#ff9dbe", "#f97ba3", "#fff1f5"];

// A simple, soft five-point sakura petal, notched at the tip.
const PETAL_PATH = "M8 0C11 3 16 7 16 11C16 14.3 12.4 16 8 16C3.6 16 0 14.3 0 11C0 7 5 3 8 0Z";

interface PetalConfig {
  key: number;
  startXPct: number;
  size: number;
  fallDuration: number;
  startProgress: number;
  swayDuration: number;
  spinDuration: number;
  opacity: number;
  color: string;
}

function makePetals(count: number): PetalConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    key: i,
    startXPct: Math.random() * 100,
    size: 10 + Math.random() * 14,
    fallDuration: 18000 + Math.random() * 16000,
    startProgress: Math.random(),
    swayDuration: 3000 + Math.random() * 3000,
    spinDuration: 7000 + Math.random() * 9000,
    opacity: 0.4 + Math.random() * 0.4,
    color: PETAL_COLORS[i % PETAL_COLORS.length],
  }));
}

function Petal({ config, height }: { config: PetalConfig; height: number }) {
  // Start mid-flight (not off-screen) so petals are visible immediately on mount
  // instead of the whole screen being empty until each one's delay elapses.
  const fall = useSharedValue(config.startProgress);
  const sway = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    fall.value = withRepeat(withTiming(1, { duration: config.fallDuration, easing: Easing.linear }), -1, false);
    sway.value = withRepeat(
      withTiming(1, { duration: config.swayDuration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    spin.value = withRepeat(
      withTiming(1, { duration: config.spinDuration, easing: Easing.linear }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const translateY = interpolate(fall.value, [0, 1], [-40, height + 40]);
    const translateX = interpolate(sway.value, [0, 1], [-14, 14]);
    const rotate = interpolate(spin.value, [0, 1], [0, 360]);
    return {
      transform: [{ translateY }, { translateX }, { rotate: `${rotate}deg` }],
    };
  });

  return (
    <Animated.View
      style={[
        { position: "absolute", left: `${config.startXPct}%`, top: 0, opacity: config.opacity },
        style,
      ]}
    >
      <Svg width={config.size} height={config.size} viewBox="0 0 16 16">
        <Path d={PETAL_PATH} fill={config.color} />
      </Svg>
    </Animated.View>
  );
}

/** Slow-drifting sakura petals, purely decorative and non-interactive. Mount once, globally. */
export function CherryBlossomBackground({ count = 16 }: { count?: number }) {
  const { height } = useWindowDimensions();
  const petals = useMemo(() => makePetals(count), [count]);

  return (
    <View pointerEvents="none" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
      {petals.map((p) => (
        <Petal key={p.key} config={p} height={height} />
      ))}
    </View>
  );
}
