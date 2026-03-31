import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right", // Better feel than "none" for secondary screens
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="blog" />
      <Stack.Screen name="blog/[id]" />
      <Stack.Screen name="budget-calculator" />
      <Stack.Screen name="chats" />
      <Stack.Screen name="community" />
      <Stack.Screen name="community/create" />
      <Stack.Screen name="community/post/[id]" />
      <Stack.Screen name="create-property" />
      <Stack.Screen name="edit-preferences" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="edit-property/[propertyId]" />
      <Stack.Screen name="feedback" />
      <Stack.Screen name="financialconsulting" />
      <Stack.Screen name="help-center" />
      <Stack.Screen name="liked-properties" />
      <Stack.Screen name="my-reports" />
      <Stack.Screen name="news" />
      <Stack.Screen name="notification-settings" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="properties/[id]" />
      <Stack.Screen name="security" />
      <Stack.Screen name="testimonials" />
      <Stack.Screen name="user-properties" />
    </Stack>
  );
}
