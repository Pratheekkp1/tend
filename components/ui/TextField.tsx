import { TextInput, type TextInputProps } from "react-native";

export function TextField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#c9b9a7"
      className="rounded-xl bg-white/70 dark:bg-white/10 border border-accent-900/5 dark:border-white/5 px-4 py-3 text-base text-ink-light dark:text-ink-dark"
      {...props}
    />
  );
}
