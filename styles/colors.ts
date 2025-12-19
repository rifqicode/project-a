/**
 * Application Color Palette
 * Centralized color definitions for consistent theming
 */

export const Colors = {
  // Primary Colors
  primary: '#3b82f6',
  primaryLight: '#eff6ff',
  primaryDark: '#2563eb',
  
  // Secondary Colors
  secondary: '#10b981',
  secondaryLight: '#d1fae5',
  
  // Status Colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fef2f2',
  info: '#3b82f6',
  infoLight: '#eff6ff',
  
  // Neutral Colors
  white: '#ffffff',
  black: '#000000',
  
  // Gray Scale
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  
  // Text Colors
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textLight: '#ffffff',
  textDark: '#111827',
  
  // Background Colors
  background: '#ffffff',
  backgroundSecondary: '#f9fafb',
  backgroundTertiary: '#f3f4f6',
  
  // Border Colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',
  
  // Shadow Color
  shadow: '#000000',
  
  // Transparent
  transparent: 'transparent',
} as const;

export type ColorKey = keyof typeof Colors;
