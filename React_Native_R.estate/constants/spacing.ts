/**
 * Spacing Design System
 * 8px grid system with consistent layout constants
 */

// Base unit for the grid system
const BASE_UNIT = 8;

// Spacing scale based on 8px grid
export const spacing = {
  // Extra small spacing
  xs: BASE_UNIT * 0.5,   // 4px

  // Small spacing
  sm: BASE_UNIT,          // 8px

  // Medium spacing
  md: BASE_UNIT * 1.5,    // 12px

  // Default spacing
  base: BASE_UNIT * 2,    // 16px

  // Large spacing
  lg: BASE_UNIT * 2.5,    // 20px

  // Extra large spacing
  xl: BASE_UNIT * 3,      // 24px

  // 2XL spacing
  '2xl': BASE_UNIT * 4,   // 32px

  // 3XL spacing
  '3xl': BASE_UNIT * 5,   // 40px

  // 4XL spacing
  '4xl': BASE_UNIT * 6,   // 48px

  // 5XL spacing
  '5xl': BASE_UNIT * 8,   // 64px

  // 6XL spacing
  '6xl': BASE_UNIT * 10,  // 80px
};

// Numeric scale for convenience
export const space = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
};

// Layout specific spacing
export const layout = {
  // Screen padding
  screenPaddingX: 20,
  screenPaddingY: 16,

  // Section spacing
  sectionGap: 32,
  sectionPaddingY: 24,

  // Card spacing
  cardPadding: 16,
  cardPaddingLg: 20,
  cardGap: 16,
  cardGapLg: 20,

  // List item spacing
  listItemGap: 12,
  listItemPadding: 16,

  // Header heights
  headerHeight: 56,
  headerHeightLg: 64,

  // Tab bar
  tabBarHeight: 70,
  tabBarPadding: 8,

  // Bottom safe area (iOS)
  bottomSafeArea: 34,

  // Modal
  modalPadding: 24,
  modalRadius: 24,

  // Input fields
  inputHeight: 52,
  inputHeightSm: 44,
  inputPaddingX: 16,
  inputPaddingY: 14,

  // Button sizes
  buttonHeightSm: 40,
  buttonHeightMd: 48,
  buttonHeightLg: 56,
  buttonPaddingX: 24,
  buttonPaddingXSm: 16,
};

// Border radius values
export const radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  full: 9999,

  // Specific component radii
  card: 20,
  cardLg: 24,
  button: 12,
  buttonSm: 8,
  buttonLg: 16,
  input: 12,
  badge: 8,
  badgePill: 9999,
  avatar: 9999,
  modal: 24,
  image: 16,
  imageLg: 20,
};

// Touch target sizes (accessibility)
export const touchTargets = {
  minimum: 44,
  comfortable: 48,
  large: 56,
};

// Icon sizes
export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
};

// Avatar sizes
export const avatarSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 72,
  '2xl': 96,
  '3xl': 128,
};

// Card dimensions
export const cardDimensions = {
  // Featured card (horizontal scroll)
  featured: {
    width: 260,
    height: 340,
  },
  // Today's choice card
  todaysChoice: {
    width: 300,
    height: 400,
  },
  // Grid card
  grid: {
    imageHeight: 180,
  },
  // Property card
  property: {
    imageHeight: 200,
  },
};

// Screen breakpoints (for responsive layouts)
export const breakpoints = {
  sm: 375,   // Small phones
  md: 414,   // Regular phones
  lg: 428,   // Large phones
  xl: 768,   // Tablets
  '2xl': 1024, // Large tablets
};

// Z-index scale
export const zIndex = {
  base: 0,
  card: 10,
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
};
