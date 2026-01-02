import "@/app/i18n";
import { AuthProvider } from "@/contexts/AuthContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { useFonts } from "expo-font";
import { Slot, SplashScreen } from "expo-router";
import { useEffect } from "react";
import "./global.css";
import { ComparisonProvider } from "@/contexts/ComparisonContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Your fonts here
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AlertProvider>
      <ComparisonProvider>
        <AuthProvider>
          <NotificationProvider>
            <ChatProvider>
              <Slot />
            </ChatProvider>
          </NotificationProvider>
        </AuthProvider>
      </ComparisonProvider>
    </AlertProvider>
  );
}
