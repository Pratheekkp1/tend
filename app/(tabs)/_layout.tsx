import { Redirect, Slot } from "expo-router";
import { NavShell } from "@/components/NavShell";
import { useAuth } from "@/lib/auth-context";
import { useRealtimeTasksSync } from "@/lib/tasks";

export default function TabsLayout() {
  const { session, loading } = useAuth();
  useRealtimeTasksSync();

  if (!loading && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <NavShell>
      <Slot />
    </NavShell>
  );
}
