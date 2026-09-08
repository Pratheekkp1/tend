import { useState } from "react";
import { TextInput, type TextInputProps } from "react-native";

export function TextField({
  style,
  onFocus,
  onBlur,
  className,
  ...rest
}: TextInputProps & { className?: string }) {
  const [focused, setFocused] = useState(false);

  const handleFocus: TextInputProps["onFocus"] = (e) => {
    setFocused(true);
    onFocus?.(e);
  };
  const handleBlur: TextInputProps["onBlur"] = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <TextInput
      placeholderTextColor="#a39a8f"
      selectionColor="#f28482"
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`rounded-xl bg-surface-subtle dark:bg-white/[0.06] border px-4 py-3 text-base text-ink-light dark:text-ink-dark ${
        focused ? "border-accent-400 dark:border-accent-400" : "border-black/5 dark:border-white/10"
      } ${className ?? ""}`}
      style={[{ outlineStyle: "none", outlineWidth: 0 } as never, style]}
      {...rest}
    />
  );
}
