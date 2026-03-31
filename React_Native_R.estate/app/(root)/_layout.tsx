import { NavigationProvider } from "@/contexts/NavigationContext";
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function RootGroupLayout() {
  return (
    <NavigationProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ animation: "none" }} />
        <Stack.Screen name="(screens)" options={{ animation: "slide_from_right" }} />
        <Stack.Screen name="(admin)" options={{ animation: "none" }} />
        <Stack.Screen name="chat" options={{ animation: "none" }} />
        <Stack.Screen name="report" options={{ animation: "none" }} />
        <Stack.Screen name="property-comparison" options={{ animation: "fade" }} />
      </Stack>
    </NavigationProvider>
  );
}
