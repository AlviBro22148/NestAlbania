/**
 * Typography Design System
 * Premium font sizes, line heights, and letter spacing
 */

export const fontSize = {
  // Display sizes - for hero sections and major headings
  display1: 48,
  display2: 40,

  // Heading sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  h5: 18,
  h6: 16,

  // Body sizes
  bodyLg: 18,
  body: 16,
  bodySm: 14,
  bodyXs: 12,

  // Caption and labels
  caption: 12,
  captionSm: 11,
  label: 14,
  labelSm: 12,

  // Special sizes
  price: 24,
  priceLg: 28,
  priceSm: 20,
  badge: 11,
  button: 16,
  buttonSm: 14,
  tabLabel: 12,
};

export const lineHeight = {
  // Tight - for headings
  tight: 1.1,

  // Snug - for subheadings
  snug: 1.25,

  // Normal - for body text
  normal: 1.5,

  // Relaxed - for longer paragraphs
  relaxed: 1.625,

  // Loose - for extra readability
  loose: 1.75,

  // Specific pixel values
  display1: 56,
  display2: 48,
  h1: 40,
  h2: 36,
  h3: 32,
  h4: 28,
  h5: 26,
  h6: 24,
  body: 24,
  bodySm: 20,
  caption: 16,
};

export const letterSpacing = {
  // Tighter - for large display text
  tighter: -0.5,

  // Tight - for headings
  tight: -0.25,

  // Normal - default
  normal: 0,

  // Wide - for small caps and labels
  wide: 0.5,

  // Wider - for badges and buttons
  wider: 0.75,

  // Widest - for uppercase labels
  widest: 1,
};

export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Font family mapping to Rubik variants
export const fontFamily = {
  light: 'Rubik-Light',
  regular: 'Rubik-Regular',
  medium: 'Rubik-Medium',
  semibold: 'Rubik-SemiBold',
  bold: 'Rubik-Bold',
  extrabold: 'Rubik-ExtraBold',
};

// Pre-composed text styles for common use cases
export const textStyles = {
  // Display styles
  display1: {
    fontSize: fontSize.display1,
    lineHeight: lineHeight.display1,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.tighter,
  },
  display2: {
    fontSize: fontSize.display2,
    lineHeight: lineHeight.display2,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.tighter,
  },

  // Heading styles
  h1: {
    fontSize: fontSize.h1,
    lineHeight: lineHeight.h1,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.tight,
  },
  h2: {
    fontSize: fontSize.h2,
    lineHeight: lineHeight.h2,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.tight,
  },
  h3: {
    fontSize: fontSize.h3,
    lineHeight: lineHeight.h3,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.tight,
  },
  h4: {
    fontSize: fontSize.h4,
    lineHeight: lineHeight.h4,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.normal,
  },
  h5: {
    fontSize: fontSize.h5,
    lineHeight: lineHeight.h5,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.normal,
  },
  h6: {
    fontSize: fontSize.h6,
    lineHeight: lineHeight.h6,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.normal,
  },

  // Body styles
  bodyLg: {
    fontSize: fontSize.bodyLg,
    lineHeight: lineHeight.body,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontSize: fontSize.body,
    lineHeight: lineHeight.body,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodySm: {
    fontSize: fontSize.bodySm,
    lineHeight: lineHeight.bodySm,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.normal,
  },
  bodyXs: {
    fontSize: fontSize.bodyXs,
    lineHeight: lineHeight.caption,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.normal,
  },

  // Caption styles
  caption: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontFamily: fontFamily.regular,
    letterSpacing: letterSpacing.wide,
  },
  captionMedium: {
    fontSize: fontSize.caption,
    lineHeight: lineHeight.caption,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.wide,
  },

  // Label styles
  label: {
    fontSize: fontSize.label,
    lineHeight: lineHeight.bodySm,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.normal,
  },
  labelSm: {
    fontSize: fontSize.labelSm,
    lineHeight: lineHeight.caption,
    fontFamily: fontFamily.medium,
    letterSpacing: letterSpacing.wide,
  },

  // Button styles
  button: {
    fontSize: fontSize.button,
    lineHeight: lineHeight.body,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },
  buttonSm: {
    fontSize: fontSize.buttonSm,
    lineHeight: lineHeight.bodySm,
    fontFamily: fontFamily.semibold,
    letterSpacing: letterSpacing.wide,
  },

  // Badge style
  badge: {
    fontSize: fontSize.badge,
    lineHeight: lineHeight.caption,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.wider,
  },

  // Price styles
  price: {
    fontSize: fontSize.price,
    lineHeight: lineHeight.h3,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.tight,
  },
  priceLg: {
    fontSize: fontSize.priceLg,
    lineHeight: lineHeight.h2,
    fontFamily: fontFamily.extrabold,
    letterSpacing: letterSpacing.tight,
  },
  priceSm: {
    fontSize: fontSize.priceSm,
    lineHeight: lineHeight.h4,
    fontFamily: fontFamily.bold,
    letterSpacing: letterSpacing.tight,
  },
};

export type TextStyleKey = keyof typeof textStyles;
