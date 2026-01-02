import { router, useNavigation } from "expo-router";
import { useCallback } from "react";

/**
 * Hook that provides safe back navigation.
 * Falls back to a specified route if there's no navigation history.
 * @param fallbackRoute - The route to navigate to if canGoBack() returns false
 * @returns handleBack function
 */
export const useBackNavigation = (fallbackRoute: string = "/(root)/(tabs)/") => {
  const navigation = useNavigation();

  const handleBack = useCallback(() => {
    try {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        router.replace(fallbackRoute as any);
      }
    } catch {
      // If navigation fails for any reason, use fallback
      try {
        router.replace(fallbackRoute as any);
      } catch {
        // Last resort: navigate to home
        router.replace("/(root)/(tabs)/" as any);
      }
    }
  }, [navigation, fallbackRoute]);

  return handleBack;
};

export default useBackNavigation;
