import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { themeStorage, ThemePreference } from "@/lib/storage";
import { lightColors, darkColors, ThemeColors } from "@/constants/colors";

interface ThemeContextType {
  themePreference: ThemePreference;
  isDark: boolean;
  colors: ThemeColors;
  setThemePreference: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => {
    return themeStorage.getTheme();
  });

  // Calculate if dark mode should be active
  const isDark = useMemo(() => {
    if (themePreference === 'system') {
      return systemColorScheme === 'dark';
    }
    return themePreference === 'dark';
  }, [themePreference, systemColorScheme]);

  // Get the appropriate color palette
  const colors = useMemo(() => {
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  // Sync with NativeWind
  useEffect(() => {
    if (themePreference === 'system') {
      setColorScheme('system');
    } else {
      setColorScheme(themePreference);
    }
  }, [themePreference, setColorScheme]);

  // Handle theme preference change
  const setThemePreference = useCallback((theme: ThemePreference) => {
    setThemePreferenceState(theme);
    themeStorage.setTheme(theme);
  }, []);

  const value = useMemo(
    () => ({
      themePreference,
      isDark,
      colors,
      setThemePreference,
    }),
    [themePreference, isDark, colors, setThemePreference]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
