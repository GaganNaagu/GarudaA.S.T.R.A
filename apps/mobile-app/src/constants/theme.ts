/**
 * Garuda A.S.T.R.A Mobile Design Tokens
 * Synchronized with DESIGN.md and Next.js globals.css
 * Aesthetic: Palantir / Defense Dark Slate (Linear & Gotham Grade)
 */

export const COLORS = {
  // Brand Colors (10% Accent Rule - Precision Defense Cyan)
  primary: '#38bdf8',
  primaryContainer: '#0284c7',
  
  // Tactical Signal & Secondary Status
  secondary: '#f59e0b',
  secondaryContainer: '#d97706',
  
  // Primary Tactical Canvas (60% Rule - Deep Neutral Obsidian Void)
  background: '#0b0d13',
  surfaceDim: '#080a0f',
  surface: '#131720',
  
  // Elevated Surfaces & Container Tiers (30% Rule)
  surfaceLowest: '#080a0f',
  surfaceLow: '#0e1118',
  surfaceContainer: '#131720',
  surfaceVariant: '#1a202c',
  surfaceHigh: '#1e2533',
  surfaceHighest: '#263042',
  
  // Hairline Outlines & Borders (Crisp, subtle dividers - zero muddy drop shadows)
  outline: 'rgba(255, 255, 255, 0.10)',
  outlineVariant: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.07)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderStrong: 'rgba(255, 255, 255, 0.14)',
  
  // Text & Content Hierarchy (Ink)
  onBackground: '#f1f5f9',
  onSurface: '#f1f5f9',
  onSurfaceVariant: '#94a3b8',
  textMuted: '#64748b',
  onPrimary: '#0b0d13',
  onPrimaryContainer: '#f1f5f9',
  onSecondary: '#0b0d13',
  onSecondaryContainer: '#f1f5f9',
  
  // Status Accents
  error: '#f43f5e',
  errorContainer: '#881337',
  onError: '#ffffff',
  onErrorContainer: '#ffe4e6',
  
  success: '#10b981',
  successContainer: '#064e3b',
  onSuccess: '#ffffff',
  
  warning: '#f59e0b',
  onWarning: '#0b0d13',
  
  info: '#38bdf8',
  onInfo: '#0b0d13',
  
  // Inverted & High-Contrast
  onInverseSurface: '#0b0d13',
  inverseSurface: '#f1f5f9',
  inversePrimary: '#0284c7',
  
  // Fixed Variants
  primaryFixed: '#bae6fd',
  primaryFixedDim: '#38bdf8',
  secondaryFixed: '#fde68a',
  secondaryFixedDim: '#f59e0b',
  tertiary: '#6366f1',
  tertiaryContainer: '#4338ca',
  tertiaryFixed: '#e0e7ff',
  tertiaryFixedDim: '#818cf8',
  onTertiary: '#ffffff',
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

// Consistent Geometry matching DESIGN.md (Cards 12px, Buttons 8px, Chips 6px, Badges 9999px)
export const ROUNDED = {
  none: 0,
  sm: 6,
  SM: 6,
  DEFAULT: 8,
  md: 12,
  MD: 12,
  lg: 16,
  LG: 16,
  xl: 24,
  XL: 24,
  full: 9999,
  FULL: 9999,
};

// Typography Scale matching DESIGN.md
export const TYPOGRAPHY = {
  displayLg: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.64,
  },
  headlineMd: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.32,
  },
  headlineSm: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  headlineSmMobile: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  bodyLg: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '400' as const,
  },
  bodyMd: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  labelCaps: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  dataMono: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  dataMonoSm: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    fontVariant: ['tabular-nums'] as any,
  },
  // Font helper string fallbacks for legacy references
  regular: 'System' as any,
  medium: 'System' as any,
  semiBold: 'System' as any,
  bold: 'System' as any,
};

// Lowercase exports for modern expo-design-system conventions
export const colors = COLORS;
export const spacing = SPACING;
export const radius = ROUNDED;
export const typography = TYPOGRAPHY;

export const theme = {
  colors: COLORS,
  spacing: SPACING,
  radius: ROUNDED,
  typography: TYPOGRAPHY,
} as const;

export default theme;
