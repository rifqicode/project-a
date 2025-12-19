/**
 * Common Styles
 * Reusable component styles for consistent UI patterns
 */
import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Shadows } from './shadows';
import { BorderRadius, Spacing } from './spacing';
import { FontSizes, FontWeights } from './typography';

export const CommonStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  containerPadded: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.base,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Card Styles
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  cardCompact: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.base,
    padding: Spacing.sm,
    ...Shadows.xs,
  },
  cardElevated: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  
  // Button Styles
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.button,
    fontWeight: FontWeights.semiBold,
  },
  buttonSecondary: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonSecondaryText: {
    color: Colors.textPrimary,
    fontSize: FontSizes.button,
    fontWeight: FontWeights.semiBold,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray300,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabledText: {
    color: Colors.gray500,
    fontSize: FontSizes.button,
    fontWeight: FontWeights.semiBold,
  },
  
  // Input Styles
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.base,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    fontSize: FontSizes.input,
    color: Colors.textPrimary,
  },
  inputFocused: {
    borderColor: Colors.primary,
    ...Shadows.xs,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputLabel: {
    fontSize: FontSizes.label,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  
  // Badge Styles
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSizes.xsmall,
    fontWeight: FontWeights.semiBold,
  },
  badgeSuccess: {
    backgroundColor: Colors.success,
  },
  badgeWarning: {
    backgroundColor: Colors.warning,
  },
  badgeError: {
    backgroundColor: Colors.error,
  },
  badgeInfo: {
    backgroundColor: Colors.info,
  },
  
  // Text Styles
  heading1: {
    fontSize: FontSizes.h1,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  heading2: {
    fontSize: FontSizes.h2,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  heading3: {
    fontSize: FontSizes.h3,
    fontWeight: FontWeights.semiBold,
    color: Colors.textPrimary,
  },
  bodyLarge: {
    fontSize: FontSizes.large,
    fontWeight: FontWeights.regular,
    color: Colors.textPrimary,
  },
  bodyBase: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontSize: FontSizes.small,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: FontSizes.caption,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
  },
  
  // List Styles
  listItem: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.xs,
  },
  listItemPressed: {
    backgroundColor: Colors.gray50,
  },
  
  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.base,
  },
  dividerVertical: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.base,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    margin: Spacing.lg,
    maxWidth: '90%',
    ...Shadows.lg,
  },
  
  // Status Styles
  statusSuccess: {
    backgroundColor: Colors.successLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
  },
  statusWarning: {
    backgroundColor: Colors.warningLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
  },
  statusError: {
    backgroundColor: Colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
  },
  statusInfo: {
    backgroundColor: Colors.infoLight,
    borderLeftWidth: 4,
    borderLeftColor: Colors.info,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
  },
});
