import { useNavContext } from "@/contexts/NavigationContext";
import { useCallback } from "react";

/**
 * Hook that provides reliable back navigation across the entire app.
 * Uses NavigationContext to track actual navigation history.
 * @param fallbackRoute - The route to navigate to if no history exists
 * @returns handleBack function
 */
export const useBackNavigation = (fallbackRoute?: string) => {
  const { goBack } = useNavContext();

  const handleBack = useCallback(() => {
    goBack(fallbackRoute);
  }, [goBack, fallbackRoute]);

  return handleBack;
};

export default useBackNavigation;
