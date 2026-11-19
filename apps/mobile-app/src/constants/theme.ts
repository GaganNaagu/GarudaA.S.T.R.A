/**
 * Garuda A.S.T.R.A Mobile Design Tokens
 * Design System: Adaptive Premium (Tactical Dark & Field Light)
 * Aligned with DESIGN.md and Next.js globals.css
 * Philosophy: Make the system powerful behind the scenes and extremely simple in the officer's hands.
 */

// Tactical Dark Palette (Default - Command Center & Night Operations)
export const TACTICAL_DARK_COLORS = {
  // Brand Colors (10% Accent Rule - Sovereign Imperial Gold)
  primary: '#d4af37',
  primaryContainer: '#9a7822',
  
  // Secondary Accents
  secondary: '#e8c86a',
  secondaryContainer: '#b38e2d',
  
  // Canvas & Surfaces (60% Rule - Deep Slate Obsidian)
  background: '#0b0f17',
  surfaceDim: '#070a0f',
  surface: '#111827',
  
  // Elevated Surfaces & Container Tiers (30% Rule)
  surfaceLowest: '#070a0f',
  surfaceLow: '#0d131f',
  surfaceContainer: '#111827',
  surfaceVariant: '#1f2937',
  surfaceHigh: '#283548',
  surfaceHighest: '#374151',
  
  // Hairline Outlines & Borders (Clean, razor-sharp 1px hairlines)
  outline: 'rgba(255, 255, 255, 0.12)',
  outlineVariant: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderStrong: 'rgba(212, 175, 55, 0.28)',
  
  // Text & Content Hierarchy (High Contrast, WCAG AAA >= 7:1)
  onBackground: '#f9fafb',
  onSurface: '#f9fafb',
  onSurfaceVariant: '#9ca3af',
  textMuted: '#6b7280',
  onPrimary: '#0b0f17',
  onPrimaryContainer: '#f9fafb',
  onSecondary: '#0b0f17',
  onSecondaryContainer: '#f9fafb',
  
  // Status Accents (Functional Signals)
  error: '#ef4444',
  errorContainer: '#7f1d1d',
  onError: '#ffffff',
  onErrorContainer: '#fee2e2',
  
  success: '#10b981',
  successContainer: '#064e3b',
  onSuccess: '#ffffff',
  
  warning: '#f59e0b',
  onWarning: '#0b0f17',
  
  info: '#38bdf8',
  onInfo: '#0b0f17',
  
  // Inverted & High-Contrast
  onInverseSurface: '#0b0f17',
  inverseSurface: '#f9fafb',
  inversePrimary: '#9a7822',
  
  // Fixed Variants
  primaryFixed: '#faecc8',
  primaryFixedDim: '#d4af37',
  secondaryFixed: '#fde68a',
  secondaryFixedDim: '#e8c86a',
  tertiary: '#f59e0b',
  tertiaryContainer: '#b45309',
  tertiaryFixed: '#fef3c7',
  tertiaryFixedDim: '#f59e0b',
  onTertiary: '#0b0f17',
  onTertiaryContainer: '#ffffff',
};

// Field Light Palette (Daylight & Direct Sunlight Operations)
export const FIELD_LIGHT_COLORS = {
  primary: '#b8860b',
  primaryContainer: '#fef3c7',
  
  secondary: '#d97706',
  secondaryContainer: '#ffedd5',
  
  background: '#f8fafc',
  surfaceDim: '#f1f5f9',
  surface: '#ffffff',
  
  surfaceLowest: '#ffffff',
  surfaceLow: '#f8fafc',
  surfaceContainer: '#ffffff',
  surfaceVariant: '#f1f5f9',
  surfaceHigh: '#e2e8f0',
  surfaceHighest: '#cbd5e1',
  
  outline: 'rgba(0, 0, 0, 0.12)',
  outlineVariant: 'rgba(0, 0, 0, 0.06)',
  border: '#e2e8f0',
  borderSubtle: 'rgba(0, 0, 0, 0.04)',
  borderStrong: 'rgba(184, 134, 11, 0.35)',
  
  onBackground: '#0f172a',
  onSurface: '#0f172a',
  onSurfaceVariant: '#475569',
  textMuted: '#94a3b8',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#0f172a',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#0f172a',
  
  error: '#dc2626',
  errorContainer: '#fee2e2',
  onError: '#ffffff',
  onErrorContainer: '#7f1d1d',
  
  success: '#059669',
  successContainer: '#d1fae5',
  onSuccess: '#ffffff',
  
  warning: '#d97706',
  onWarning: '#ffffff',
  
  info: '#0284c7',
  onInfo: '#ffffff',
  
  onInverseSurface: '#f8fafc',
  inverseSurface: '#0f172a',
  inversePrimary: '#b8860b',
  
  primaryFixed: '#faecc8',
  primaryFixedDim: '#b8860b',
  secondaryFixed: '#fde68a',
  secondaryFixedDim: '#d97706',
  tertiary: '#d97706',
  tertiaryContainer: '#fed7aa',
  tertiaryFixed: '#ffedd5',
  tertiaryFixedDim: '#d97706',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#0f172a',
};

// Default export is Tactical Dark for field surveillance
export const COLORS = TACTICAL_DARK_COLORS;

// Strict 4pt Spacing Scale matching DESIGN.md
export const SPACING = {
  unit: 4,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,

  // Ergonomic & Layout Shortcuts
  stackGap: 12,
  containerPadding: 16,
  gutter: 16,
  groupSpacing: 24,
  touchTargetMin: 48, // Apple HIG / Material 3 recommended minimum: 44-48pt
};

// Consistent Geometry matching DESIGN.md
export const ROUNDED = {
  NONE: 0,
  XS: 4,
  SM: 6,
  DEFAULT: 8,
  MD: 10,
  LG: 12,
  XL: 16,
  XXL: 20,
  FULL: 9999,

  // Aliases for compatibility
  none: 0,
  xs: 4,
  sm: 6,
  default: 8,
  md: 10,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Clean, Authoritative Typography Ramp (Free of AI-slop all-caps overuse)
export const TYPOGRAPHY = {
  // Display / Hero Headings
  displayLarge: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  displayMedium: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    color: COLORS.onSurface,
  },
  headlineMd: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
    color: COLORS.onSurface,
  },
  headlineSm: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
    color: COLORS.onSurface,
  },
  headlineSmMobile: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600' as const,
    color: COLORS.onSurface,
  },

  // Titles & Section Headers
  titleLarge: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    color: COLORS.onSurface,
  },
  titleMedium: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
    color: COLORS.onSurface,
  },
  titleSmall: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
    color: COLORS.onSurface,
  },

  // Body Content
  bodyLarge: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
    color: COLORS.onSurface,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    color: COLORS.onSurface,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    color: COLORS.onSurfaceVariant,
  },

  // Labels & Tags
  labelLarge: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600' as const,
    color: COLORS.onSurface,
  },
  labelMedium: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    color: COLORS.onSurfaceVariant,
  },
  labelSmall: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600' as const,
    color: COLORS.textMuted,
  },
  labelCaps: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    color: COLORS.primary,
  },

  // Data / Precision Numeric
  dataMono: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'monospace',
    fontWeight: '600' as const,
    color: COLORS.onSurface,
  },
  dataMonoSm: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'monospace',
    fontWeight: '600' as const,
    color: COLORS.onSurfaceVariant,
  },

  // Aliases for backward compatibility
  displayLg: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
    color: COLORS.onSurface,
  },
  bodyLg: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
    color: COLORS.onSurface,
  },
  bodyMd: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    color: COLORS.onSurface,
  },
  bodySm: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    color: COLORS.onSurfaceVariant,
  },
  regular: 'System' as any,
  medium: 'System' as any,
  semiBold: 'System' as any,
  bold: 'System' as any,
};
