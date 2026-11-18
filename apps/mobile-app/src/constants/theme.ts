/**
 * Garuda A.S.T.R.A Mobile Design Tokens
 * Synchronized with DESIGN.md and Next.js globals.css
 * Aesthetic: Grand Imperial Gold (Garuda Sovereign Intelligence)
 */

export const COLORS = {
  // Brand Colors (10% Accent Rule - Imperial Burnished Gold)
  primary: '#d4af37',
  primaryContainer: '#9a7822',
  
  // Celestial Sunlight Gold & Secondary Accents
  secondary: '#e8c86a',
  secondaryContainer: '#b38e2d',
  
  // Primary Tactical Canvas (60% Rule - Deep Imperial Bronze-Obsidian)
  background: '#0a0908',
  surfaceDim: '#070605',
  surface: '#131210',
  
  // Elevated Surfaces & Container Tiers (30% Rule)
  surfaceLowest: '#070605',
  surfaceLow: '#0e0d0b',
  surfaceContainer: '#131210',
  surfaceVariant: '#1b1916',
  surfaceHigh: '#24211d',
  surfaceHighest: '#2f2b26',
  
  // Hairline Outlines & Borders (Razor-sharp Burnished Gold Hairlines)
  outline: 'rgba(212, 175, 55, 0.20)',
  outlineVariant: 'rgba(212, 175, 55, 0.10)',
  border: 'rgba(212, 175, 55, 0.15)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderStrong: 'rgba(212, 175, 55, 0.35)',
  
  // Text & Content Hierarchy (Warm Champagne Ink)
  onBackground: '#fbf7ee',
  onSurface: '#fbf7ee',
  onSurfaceVariant: '#a8a29e',
  textMuted: '#78716c',
  onPrimary: '#0a0908',
  onPrimaryContainer: '#fbf7ee',
  onSecondary: '#0a0908',
  onSecondaryContainer: '#fbf7ee',
  
  // Status Accents (Functional Signals)
  error: '#e11d48',
  errorContainer: '#881337',
  onError: '#ffffff',
  onErrorContainer: '#ffe4e6',
  
  success: '#10b981',
  successContainer: '#064e3b',
  onSuccess: '#ffffff',
  
  warning: '#d4af37',
  onWarning: '#0a0908',
  
  info: '#38bdf8',
  onInfo: '#0a0908',
  
  // Inverted & High-Contrast
  onInverseSurface: '#0a0908',
  inverseSurface: '#fbf7ee',
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
  onTertiary: '#0a0908',
  onTertiaryContainer: '#ffffff',
};

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
