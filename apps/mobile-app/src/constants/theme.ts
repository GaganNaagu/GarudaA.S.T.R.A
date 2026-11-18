/**
 * Garuda A.S.T.R.A Mobile Design Tokens
 * Synchronized with DESIGN.md and Next.js globals.css
 * Aesthetic: Tactical Command Intelligence (Obsidian & Amber Gold)
 */

export const COLORS = {
  // Brand Colors (10% Accent Rule - Garuda Tactical Amber Gold)
  primary: '#f59e0b',
  primaryContainer: '#d97706',
  
  // Tactical Telemetry & Radar (AI Facial Recognition & Radar Signals)
  secondary: '#06b6d4',
  secondaryContainer: '#0891b2',
  
  // Primary Tactical Canvas (60% Rule - Deep Obsidian Void)
  background: '#090d16',
  surfaceDim: '#090d16',
  surface: '#111726',
  
  // Elevated Surfaces & Container Tiers (30% Rule)
  surfaceLowest: '#060910',
  surfaceLow: '#0d121e',
  surfaceContainer: '#111726',
  surfaceVariant: '#172033',
  surfaceHigh: '#172033',
  surfaceHighest: '#1e293b',
  
  // Hairline Outlines & Borders (Zero muddy drop shadows)
  outline: 'rgba(255, 255, 255, 0.12)',
  outlineVariant: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.05)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  
  // Text & Content Hierarchy (Ink)
  onBackground: '#f8fafc',
  onSurface: '#f8fafc',
  onSurfaceVariant: '#94a3b8',
  textMuted: '#64748b',
  onPrimary: '#090d16',
  onPrimaryContainer: '#090d16',
  onSecondary: '#090d16',
  onSecondaryContainer: '#f8fafc',
  
  // Status Accents
  error: '#ef4444',
  errorContainer: '#7f1d1d',
  onError: '#ffffff',
  onErrorContainer: '#fecaca',
  
  success: '#10b981',
  successContainer: '#064e3b',
  onSuccess: '#ffffff',
  
  warning: '#f59e0b',
  onWarning: '#090d16',
  
  info: '#3b82f6',
  onInfo: '#ffffff',
  
  // Inverted & High-Contrast
  onInverseSurface: '#090d16',
  inverseSurface: '#f8fafc',
  inversePrimary: '#d97706',
  
  // Fixed Variants
  primaryFixed: '#ffdfa0',
  primaryFixedDim: '#f59e0b',
  secondaryFixed: '#acedff',
  secondaryFixedDim: '#06b6d4',
  tertiary: '#3b82f6',
  tertiaryContainer: '#1d4ed8',
  tertiaryFixed: '#dbeafe',
  tertiaryFixedDim: '#93c5fd',
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
