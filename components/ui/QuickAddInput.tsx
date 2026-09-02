import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function QuickAddInput({
  placeholder,
  onSubmit,
}: {
  placeholder: string;
  onSubmit: (title: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  return (
    <View className="flex-row items-center rounded-xl bg-gray-100 dark:bg-white/10 px-3">
      <Ionicons name="add" size={20} className="text-gray-400" color="#9ca3af" />
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        onSubmitEditing={submit}
        returnKeyType="done"
        className="flex-1 px-2 py-3 text-base text-gray-900 dark:text-white"
      />
      {value.length > 0 && (
        <Pressable
          onPress={submit}
          className="rounded-lg bg-accent-500 px-3 py-1.5 active:bg-accent-600"
        >
          <Ionicons name="arrow-up" size={16} color="white" />
        </Pressable>
      )}
    </View>
  );
}
