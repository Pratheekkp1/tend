import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function ConfigNotice({ title, body }: { title: string; body: string }) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="max-w-sm items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/10">
          <Ionicons name="flower-outline" size={26} color="#ec5a8a" />
        </View>
        <Text className="text-center text-lg font-semibold text-ink-light dark:text-ink-dark">
          {title}
        </Text>
        <Text className="text-center text-sm leading-5 text-ink-light/60 dark:text-ink-dark/60">
          {body}
        </Text>
      </View>
    </View>
  );
}
