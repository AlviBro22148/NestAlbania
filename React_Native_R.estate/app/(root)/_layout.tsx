import { NavigationProvider } from "@/contexts/NavigationContext";
import { Stack } from "expo-router";

export default function RootGroupLayout() {
  return (
    <NavigationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="report" />
        <Stack.Screen name="property-comparison" />
      </Stack>
    </NavigationProvider>
  );
}
