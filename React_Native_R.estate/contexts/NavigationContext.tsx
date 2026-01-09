import { router, usePathname } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useRef } from "react";

interface NavigationContextType {
  goBack: (fallback?: string) => void;
  getPreviousRoute: () => string | null;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

// Routes that should be ignored in history (modals, etc.)
const IGNORED_ROUTES = ["/auth/sign-in", "/auth/sign-up", "/auth/forgot-password"];

// Default fallback route
const DEFAULT_FALLBACK = "/(root)/(tabs)/";

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  // Use ref to store history to avoid re-renders
  const historyRef = useRef<string[]>([]);
  const currentPathRef = useRef<string>("");
  const pathname = usePathname();

  // Track navigation changes
  useEffect(() => {
    if (!pathname) return;

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

      // Navigate to the previous route
      router.replace(previousRoute as any);
    } else {
      // No history, use fallback
      router.replace((fallback || DEFAULT_FALLBACK) as any);
    }
  }, []);

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
