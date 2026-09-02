import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function ConfigNotice({ title, body }: { title: string; body: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-surface-subtle dark:bg-surface-dark px-8">
      <View className="max-w-sm items-center gap-4">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/10">
          <Ionicons name="construct-outline" size={28} color="#4c65f7" />
        </View>
        <Text className="text-center text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </Text>
        <Text className="text-center text-sm leading-5 text-gray-500 dark:text-gray-400">
          {body}
        </Text>
      </View>
    </View>
  );
}
