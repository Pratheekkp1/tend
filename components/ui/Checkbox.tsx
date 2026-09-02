import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function Checkbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      className={`h-6 w-6 items-center justify-center rounded-full border-2 ${
        checked
          ? "border-accent-500 bg-accent-500"
          : "border-gray-300 dark:border-white/25"
      }`}
    >
      {checked && <Ionicons name="checkmark" size={16} color="white" />}
    </Pressable>
  );
}
