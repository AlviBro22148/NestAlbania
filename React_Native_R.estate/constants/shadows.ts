/**
 * Shadow Design System
 * Multi-level premium shadow system for depth and elevation
 */

import { Platform, ViewStyle } from 'react-native';

// Shadow color tokens
export const shadowColors = {
  light: {
    default: '#1A1F36',
    primary: '#1E3A5F',
    accent: '#E07A5F',
  },
  dark: {
    default: '#000000',
    primary: '#4B7BEC',
    accent: '#F4845F',
  },
};

// Base shadow definitions
interface ShadowDefinition {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

// Premium shadow levels for light mode
export const shadows = {
  // No shadow
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  } as ShadowDefinition,

  // Extra small - subtle lift
  xs: {
    shadowColor: shadowColors.light.default,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  } as ShadowDefinition,

  // Small - for cards at rest
  sm: {
    shadowColor: shadowColors.light.default,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  } as ShadowDefinition,

  // Medium - for cards on hover/focus
  md: {
    shadowColor: shadowColors.light.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  } as ShadowDefinition,

  // Large - for floating elements
  lg: {
    shadowColor: shadowColors.light.default,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  } as ShadowDefinition,

  // Extra large - for modals and overlays
  xl: {
    shadowColor: shadowColors.light.default,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  } as ShadowDefinition,

  // 2XL - for prominent floating elements
  '2xl': {
    shadowColor: shadowColors.light.default,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  } as ShadowDefinition,
};

// Dark mode shadows (more subtle)
export const shadowsDark = {
  none: shadows.none,

  xs: {
    ...shadows.xs,
    shadowColor: shadowColors.dark.default,
    shadowOpacity: 0.2,
  } as ShadowDefinition,

  sm: {
    ...shadows.sm,
    shadowColor: shadowColors.dark.default,
    shadowOpacity: 0.25,
  } as ShadowDefinition,

  md: {
    ...shadows.md,
    shadowColor: shadowColors.dark.default,
    shadowOpacity: 0.3,
  } as ShadowDefinition,

  lg: {
    ...shadows.lg,
    shadowColor: shadowColors.dark.default,
    shadowOpacity: 0.35,
  } as ShadowDefinition,

  xl: {
    ...shadows.xl,
    shadowColor: shadowColors.dark.default,
    shadowOpacity: 0.4,
  } as ShadowDefinition,

  '2xl': {
    ...shadows['2xl'],
    shadowColor: shadowColors.dark.default,
    shadowOpacity: 0.45,
  } as ShadowDefinition,
};

// Colored shadows for accents
export const coloredShadows = {
  primary: {
    sm: {
      shadowColor: shadowColors.light.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    } as ShadowDefinition,
    md: {
      shadowColor: shadowColors.light.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    } as ShadowDefinition,
    lg: {
      shadowColor: shadowColors.light.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    } as ShadowDefinition,
  },
  accent: {
    sm: {
      shadowColor: shadowColors.light.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    } as ShadowDefinition,
    md: {
      shadowColor: shadowColors.light.accent,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    } as ShadowDefinition,
    lg: {
      shadowColor: shadowColors.light.accent,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    } as ShadowDefinition,
  },
};

// Card shadow presets
export const cardShadows = {
  // Default card shadow
  default: shadows.sm,

  // Elevated card (on press or hover)
  elevated: shadows.md,

  // Featured/hero card shadow
  featured: shadows.lg,

  // Floating action button
  fab: {
    shadowColor: shadowColors.light.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  } as ShadowDefinition,

  // Tab bar shadow
  tabBar: {
    shadowColor: shadowColors.light.default,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  } as ShadowDefinition,

  // Header shadow
  header: {
    shadowColor: shadowColors.light.default,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  } as ShadowDefinition,

  // Modal shadow
  modal: shadows.xl,

  // Input focus shadow
  inputFocus: {
    shadowColor: shadowColors.light.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
  } as ShadowDefinition,

  // Button shadow
  button: shadows.sm,
  buttonPressed: shadows.xs,
  buttonAccent: coloredShadows.accent.sm,
};

// Helper function to get shadow based on theme
export const getShadow = (level: keyof typeof shadows, isDark: boolean): ShadowDefinition => {
  return isDark ? shadowsDark[level] : shadows[level];
};

// Helper function to apply platform-specific shadow
export const applyShadow = (shadow: ShadowDefinition): ViewStyle => {
  if (Platform.OS === 'android') {
    return {
      elevation: shadow.elevation,
      shadowColor: shadow.shadowColor,
    };
  }
  return {
    shadowColor: shadow.shadowColor,
    shadowOffset: shadow.shadowOffset,
    shadowOpacity: shadow.shadowOpacity,
    shadowRadius: shadow.shadowRadius,
  };
};

// Combined shadow styles for common use cases
export const shadowStyles = {
  card: applyShadow(cardShadows.default),
  cardElevated: applyShadow(cardShadows.elevated),
  cardFeatured: applyShadow(cardShadows.featured),
  fab: applyShadow(cardShadows.fab),
  tabBar: applyShadow(cardShadows.tabBar),
  header: applyShadow(cardShadows.header),
  modal: applyShadow(cardShadows.modal),
  button: applyShadow(cardShadows.button),
};

export type ShadowLevel = keyof typeof shadows;
