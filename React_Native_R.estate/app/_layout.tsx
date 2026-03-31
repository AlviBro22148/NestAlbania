import "@/app/i18n";
import { AuthProvider } from "@/contexts/AuthContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { LikedPropertiesProvider } from "@/contexts/LikedPropertiesContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryClient, mmkvPersister, prefetchAllTabData } from "@/lib/queryClient";
import { useFonts } from "expo-font";
import { Slot, SplashScreen, router, useSegments, useRootNavigationState } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Platform, AppState, StatusBar, InteractionManager } from "react-native";
import { enableScreens, enableFreeze } from "react-native-screens";

enableScreens(true);
enableFreeze(true);
import "./global.css";
import { ComparisonProvider } from "@/contexts/ComparisonContext";
import { initializeStorage, onboardingStorage } from "@/lib/storage";

// Safe import for expo-navigation-bar
let NavigationBar: any = null;
try {
  NavigationBar = require("expo-navigation-bar");
  // NavigationBar logic
} catch (e) {
  // Silent fail
}

SplashScreen.preventAutoHideAsync();

// StatusBar component that responds to theme
function ThemedStatusBar() {
  const { isDark } = useTheme();
  return (
    <StatusBar
      barStyle={isDark ? "light-content" : "dark-content"}
      backgroundColor="transparent"
      translucent
    />
  );
}

export default function RootLayout() {
  const [storageReady, setStorageReady] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const hasPrefetched = useRef(false);
  const hasRedirectedToOnboarding = useRef(false);

  const [fontsLoaded] = useFonts({
    "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
    "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
    "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
  });

  // Helper to apply navigation bar settings
  const updateSystemUI = async () => {
    if (Platform.OS === "android" && NavigationBar) {
      try {
        await NavigationBar.setVisibilityAsync("hidden");
        await NavigationBar.setBehaviorAsync("overlay-swipe");
      } catch (e) {
        // Silent fail
      }
    }
  };

  useEffect(() => {
    initializeStorage().then(() => setStorageReady(true));

    // Hide bar on initial load
    updateSystemUI();

    // Re-hide bar whenever the app returns from background/multitasking
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        updateSystemUI();
      }
    });

    return () => subscription.remove();
  }, []);

  // Instagram-style prefetching: Load ALL tab data immediately on app start
  useEffect(() => {
    if (storageReady && !hasPrefetched.current) {
      hasPrefetched.current = true;
      // Delay prefetching to avoid blocking app startup or splash screen transition
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          prefetchAllTabData();
        }, 3000); // 3-second delay after interactions to allow UI to settle
      });
    }
  }, [storageReady]);

  // Check onboarding status after storage is ready
  useEffect(() => {
    if (!storageReady || !navigationState?.key) return;

    const inOnboarding = segments[0] === "onboarding";
    const hasSeenOnboarding = onboardingStorage.hasSeenOnboarding();

    if (!hasSeenOnboarding && !inOnboarding && !hasRedirectedToOnboarding.current) {
      hasRedirectedToOnboarding.current = true;
      router.replace("/onboarding");
    }

    setOnboardingChecked(true);
  }, [storageReady, segments, navigationState?.key]);

  useEffect(() => {
    // Hide splash when fonts, storage, and onboarding check are ready
    if (fontsLoaded && storageReady && onboardingChecked) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, storageReady, onboardingChecked]);

  // Wait for both fonts and storage before rendering
  if (!fontsLoaded || !storageReady) return null;

  // Use PersistQueryClientProvider if MMKV persister is available (L2 disk cache)
  const QueryProvider = mmkvPersister ? PersistQueryClientProvider : QueryClientProvider;
  const queryProviderProps = mmkvPersister
    ? { client: queryClient, persistOptions: { persister: mmkvPersister, maxAge: 24 * 60 * 60 * 1000 } }
    : { client: queryClient };

  return (
    <QueryProvider {...queryProviderProps}>
      <ThemeProvider>
        <ThemedStatusBar />
        <AlertProvider>
          <ComparisonProvider>
            <AuthProvider>
              <LikedPropertiesProvider>
                <NotificationProvider>
                  <ChatProvider>
                    <Slot />
                  </ChatProvider>
                </NotificationProvider>
              </LikedPropertiesProvider>
            </AuthProvider>
          </ComparisonProvider>
        </AlertProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
