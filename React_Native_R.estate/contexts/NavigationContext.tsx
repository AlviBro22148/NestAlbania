import { router, usePathname } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { BackHandler } from "react-native";

interface NavigationContextType {
  goBack: (fallback?: string) => void;
  getPreviousRoute: () => string | null;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

// Routes that should be ignored in history (modals, etc.)
const IGNORED_ROUTES = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password"];

// Main tab routes - don't go back from these, exit app instead
const MAIN_TAB_ROUTES = [
  "/(root)/(tabs)",
  "/(root)/index",
  "/(root)/explore",
  "/(root)/market",
  "/(root)/services",
  "/(root)/profile",
];

// Default fallback route
const DEFAULT_FALLBACK = "/(root)/";

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  // Use ref to store history to avoid re-renders
  const historyRef = useRef<string[]>([]);
  const currentPathRef = useRef<string>("");
  const isInternalNavigatingRef = useRef<boolean>(false);
  const pathname = usePathname();

  // Track navigation changes
  useEffect(() => {
    if (!pathname) return;

    // If we're navigating back internally, don't add to history
    if (isInternalNavigatingRef.current) {
      isInternalNavigatingRef.current = false;
      currentPathRef.current = pathname;
      return;
    }

    // Don't add duplicate consecutive entries
    if (pathname === currentPathRef.current) return;

    // Don't add ignored routes to history
    if (IGNORED_ROUTES.some(route => pathname.startsWith(route))) return;

    // Store the previous path before updating
    if (currentPathRef.current && currentPathRef.current !== pathname) {
      // Add to history, keeping max 20 entries
      historyRef.current = [...historyRef.current.slice(-19), currentPathRef.current];
    }

    currentPathRef.current = pathname;
  }, [pathname]);

  const getPreviousRoute = useCallback((): string | null => {
    const history = historyRef.current;
    if (history.length === 0) return null;
    return history[history.length - 1];
  }, []);

  const goBack = useCallback((fallback?: string) => {
    const history = historyRef.current;

    if (history.length > 0) {
      // Get the previous route
      const previousRoute = history[history.length - 1];

      // Remove it from history
      historyRef.current = history.slice(0, -1);

      // Set internal navigation flag to ignore this change in the tracker
      isInternalNavigatingRef.current = true;

      // Navigate to the previous route
      router.replace(previousRoute as any);
      return true;
    } else {
      // No history, use fallback if provided
      if (fallback) {
        isInternalNavigatingRef.current = true;
        router.replace(fallback as any);
        return true;
      }
      return false;
    }
  }, []);

  // Handle Android back button/gesture
  useEffect(() => {
    const handleBackPress = () => {
      // If on a main tab route with no history, let the system handle it (exit app)
      const isMainTab = MAIN_TAB_ROUTES.some(route =>
        currentPathRef.current === route ||
        currentPathRef.current === "/" ||
        currentPathRef.current === ""
      );

      if (isMainTab && historyRef.current.length === 0) {
        // Let the default back behavior happen (exit app)
        return false;
      }

      // Use our navigation history to go back
      const didGoBack = goBack();

      if (!didGoBack) {
        // No history and not on main tab, go to home
        isInternalNavigatingRef.current = true;
        router.replace(DEFAULT_FALLBACK as any);
      }

      // Return true to prevent default back behavior
      return true;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", handleBackPress);

    return () => subscription.remove();
  }, [goBack]);

  return (
    <NavigationContext.Provider value={{ goBack, getPreviousRoute }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavContext() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavContext must be used within NavigationProvider");
  }
  return context;
}

export default NavigationContext;

