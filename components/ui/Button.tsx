import { Pressable, Text, type PressableProps } from "react-native";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent-500 active:bg-accent-600",
  secondary:
    "bg-white/70 dark:bg-white/10 border border-accent-900/5 dark:border-white/5 active:bg-white/90 dark:active:bg-white/15",
  ghost: "bg-transparent active:bg-accent-500/5",
  danger: "bg-red-50/80 dark:bg-red-500/10 active:bg-red-100 dark:active:bg-red-500/20",
};

const labelClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "text-white",
  secondary: "text-ink-light dark:text-ink-dark",
  ghost: "text-accent-600 dark:text-accent-300",
  danger: "text-red-600 dark:text-red-400",
};

export function Button({
  label,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps & { className?: string }) {
  return (
    <Pressable
      {...props}
      className={`flex-row items-center justify-center rounded-xl ${
        size === "sm" ? "px-3 py-2" : "px-4 py-3"
      } ${variantClasses[variant]} ${className ?? ""}`}
    >
      <Text
        className={`font-semibold ${size === "sm" ? "text-sm" : "text-base"} ${labelClasses[variant]}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
