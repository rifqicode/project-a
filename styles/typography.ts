/**
 * Typography System
 * Centralized font sizes and weights for consistent typography
 */

export const FontSizes = {
  // Headings
  h1: 32,
  h2: 24,
  h3: 20,
  h4: 18,
  h5: 16,
  h6: 14,
  
  // Body Text
  xlarge: 20,
  large: 18,
  base: 16,
  medium: 14,
  small: 12,
  xsmall: 10,
  
  // Special Sizes
  icon: 24,
  iconLarge: 40,
  button: 16,
  input: 16,
  label: 14,
  caption: 12,
  tiny: 10,
} as const;

export const FontWeights = {
  thin: '100',
  extraLight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;

export type FontSizeKey = keyof typeof FontSizes;
export type FontWeightKey = keyof typeof FontWeights;
export type LineHeightKey = keyof typeof LineHeights;
