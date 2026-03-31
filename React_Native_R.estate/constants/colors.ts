/**
 * Premium Color Palette
 * Deep Navy (#1E3A5F) + Warm Coral (#E07A5F)
 */

// Brand colors
export const brandColors = {
  // Primary - Deep Navy
  navy: {
    50: '#EEF2F6',
    100: '#D5DFE9',
    200: '#AABFD3',
    300: '#7F9FBD',
    400: '#547FA7',
    500: '#1E3A5F', // Primary
    600: '#1A3254',
    700: '#152A47',
    800: '#11223A',
    900: '#0C1A2D',
  },

  // Accent - Warm Coral
  coral: {
    50: '#FDF4F2',
    100: '#FCE8E4',
    200: '#F8D1C9',
    300: '#F4BAAE',
    400: '#ECA393',
    500: '#E07A5F', // Accent
    600: '#D66B4F',
    700: '#C45A3F',
    800: '#A84A33',
    900: '#8C3A27',
  },

  // Supporting colors
  gold: '#D4A03E',
  forest: '#2E7D5A',
};

// Semantic light mode colors
export const lightColors = {
  // Core
  primary: '#1E3A5F',
  primaryLight: 'rgba(30, 58, 95, 0.08)',
  primaryDark: '#152A47',

  accent: '#E07A5F',
  accentLight: 'rgba(224, 122, 95, 0.12)',
  accentDark: '#D66B4F',

  // Backgrounds
  background: '#FAFBFC',
  surface: '#FFFFFF',
  surfaceElevated: '#F7F8FA',
  surfaceOverlay: 'rgba(30, 58, 95, 0.04)',

  // Text
  text: '#1A1F36',
  textSecondary: '#525F7F',
  textMuted: '#8898AA',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#FFFFFF',

  // Borders
  border: '#E6E8EB',
  borderLight: '#F0F2F5',
  borderFocus: '#1E3A5F',

  // Status colors
  success: '#2E7D5A',
  successLight: 'rgba(46, 125, 90, 0.1)',
  warning: '#D4A03E',
  warningLight: 'rgba(212, 160, 62, 0.1)',
  danger: '#C43B3B',
  dangerLight: 'rgba(196, 59, 59, 0.1)',
  info: '#4B7BEC',
  infoLight: 'rgba(75, 123, 236, 0.1)',

  // Component colors
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: 'rgba(30, 58, 95, 0.08)',

  // Icon colors
  icon: '#525F7F',
  iconActive: '#1E3A5F',
  iconMuted: '#8898AA',

  // Badge colors
  badgePrimary: '#1E3A5F',
  badgeAccent: '#E07A5F',
  badgeGold: '#D4A03E',
  badgeSuccess: '#2E7D5A',
  badgeRent: '#7C3AED',
  badgeRentBg: 'rgba(124, 58, 237, 0.1)',
  badgeSale: '#1E3A5F',
  badgeSaleBg: 'rgba(30, 58, 95, 0.1)',

  // Overlays
  overlay: 'rgba(26, 31, 54, 0.5)',
  overlayLight: 'rgba(26, 31, 54, 0.3)',

  // Shimmer (skeleton loading)
  shimmerBase: '#E6E8EB',
  shimmerHighlight: '#F0F2F5',

  // Gradients (stored as arrays for LinearGradient)
  gradientPrimary: ['#1E3A5F', '#2E4A6F'],
  gradientAccent: ['#E07A5F', '#E8927A'],
  gradientCard: ['transparent', 'rgba(0, 0, 0, 0.7)'],
};

// Semantic dark mode colors
export const darkColors = {
  // Core
  primary: '#4B7BEC',
  primaryLight: 'rgba(75, 123, 236, 0.15)',
  primaryDark: '#3A6AD9',

  accent: '#F4845F',
  accentLight: 'rgba(244, 132, 95, 0.15)',
  accentDark: '#E07A5F',

  // Backgrounds
  background: '#0D1117',
  surface: '#161B22',
  surfaceElevated: '#21262D',
  surfaceOverlay: 'rgba(75, 123, 236, 0.08)',

  // Text
  text: '#F0F6FC',
  textSecondary: '#8B949E',
  textMuted: '#6E7681',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#FFFFFF',

  // Borders
  border: '#30363D',
  borderLight: '#21262D',
  borderFocus: '#4B7BEC',

  // Status colors
  success: '#3FB950',
  successLight: 'rgba(63, 185, 80, 0.15)',
  warning: '#E3B341',
  warningLight: 'rgba(227, 179, 65, 0.15)',
  danger: '#F85149',
  dangerLight: 'rgba(248, 81, 73, 0.15)',
  info: '#58A6FF',
  infoLight: 'rgba(88, 166, 255, 0.15)',

  // Component colors
  card: '#161B22',
  cardElevated: '#21262D',
  tabBar: '#161B22',
  tabBarBorder: '#30363D',

  // Icon colors
  icon: '#8B949E',
  iconActive: '#4B7BEC',
  iconMuted: '#6E7681',

  // Badge colors
  badgePrimary: '#4B7BEC',
  badgeAccent: '#F4845F',
  badgeGold: '#E3B341',
  badgeSuccess: '#3FB950',
  badgeRent: '#A371F7',
  badgeRentBg: 'rgba(163, 113, 247, 0.15)',
  badgeSale: '#4B7BEC',
  badgeSaleBg: 'rgba(75, 123, 236, 0.15)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Shimmer (skeleton loading)
  shimmerBase: '#21262D',
  shimmerHighlight: '#30363D',

  // Gradients
  gradientPrimary: ['#4B7BEC', '#5B8BFC'],
  gradientAccent: ['#F4845F', '#F9957A'],
  gradientCard: ['transparent', 'rgba(0, 0, 0, 0.85)'],
};

export type ThemeColors = typeof lightColors;

// Utility function to get color with alpha
export const withAlpha = (hex: string, alpha: number): string => {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Common color combinations for quick access
export const colorCombinations = {
  light: {
    cardBackground: lightColors.card,
    cardBorder: lightColors.border,
    inputBackground: lightColors.surface,
    inputBorder: lightColors.border,
    inputFocusBorder: lightColors.primary,
    buttonPrimary: lightColors.primary,
    buttonAccent: lightColors.accent,
    tabActive: lightColors.primary,
    tabInactive: lightColors.textMuted,
  },
  dark: {
    cardBackground: darkColors.card,
    cardBorder: darkColors.border,
    inputBackground: darkColors.surfaceElevated,
    inputBorder: darkColors.border,
    inputFocusBorder: darkColors.primary,
    buttonPrimary: darkColors.primary,
    buttonAccent: darkColors.accent,
    tabActive: darkColors.primary,
    tabInactive: darkColors.textMuted,
  },
};
