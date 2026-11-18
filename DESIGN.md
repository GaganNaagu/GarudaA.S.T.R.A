# DESIGN SYSTEM & AESTHETIC RULES

## 1. Visual Identity & Tone
- **Aesthetic Direction:** Palantir / Defense Dark Slate (Linear & Gotham Grade) — Precision-engineered, mission-critical law enforcement and defense surveillance intelligence. Dark-mode primary for 24/7 command center operations, tactile feedback, razor-sharp hairline borders, dense telemetry data hierarchy, and zero visual fluff or "AI slop".
- **Color Restraint (Strict 60-30-10 Rule):**
  - **Primary Canvas (60%):** `#0B0D13` (Dark / Command Center) / `#F8FAFC` (Light / Field Daylight) — Deep Neutral Obsidian, high contrast, zero muddy blue tint.
  - **Elevated Surface (30%):** `#131720` (Dark Cards/Panels) & `#1A202C` (Elevated/Hover Tiers) / `#FFFFFF` (Light Cards) & `#F1F5F9` (Light Elevated).
  - **Single Brand Accent (10%):** `#38BDF8` (Precision Defense Cyan / Sky) — High-clarity tactical focus, reserved strictly for primary interactive CTAs, active selection states, and live link beacons.
  - **Status Signals (Functional, Never Decorative):**
    - Critical Threat / Wanted / Rejected: `#F43F5E` (Tactical Rose/Crimson)
    - High-Confidence Match / Sighting Lead: `#F59E0B` (Amber Gold)
    - Confirmed / Secure / Nominal: `#10B981` (Tactical Emerald)
    - Operational Info / Telemetry: `#38BDF8` (Defense Cyan)
  - **Ink / Text Hierarchy:**
    - Dark Mode: Primary `#F1F5F9` (Slate 100), Secondary `#94A3B8` (Slate 400), Muted `#64748B` (Slate 500).
    - Light Mode: Primary `#0F172A` (Slate 900), Secondary `#475569` (Slate 600), Muted `#94A3B8` (Slate 400).
- **Borders & Depth:** Use crisp `1px` hairline borders (`rgba(255,255,255,0.07)` dark / `rgba(0,0,0,0.08)` light, or `#1E2533`) instead of muddy drop shadows.

## 2. Anti-Slop Layout Architecture (Zero Tolerance)
- **NO "Everything's a Card":** Never wrap every single list item in a thick-bordered, drop-shadowed box with multiple nested action buttons. Use Inset-Grouped Lists with hairline dividers (`StyleSheet.hairlineWidth`).
- **NO Dual Buttons per Row:** List rows are tap-to-inspect targets (`Pressable` with subtle highlight). Specific actions belong in the detail sheet or swipe/context actions.
- **NO Fake Sci-Fi / Cyberpunk Gimmicks:** No neon perimeter glows, scanline grids, or decorative fake coordinate widgets taking up 30% of the screen.
- **NO Gaudy Yellow Tab Bars:** System navigation uses subtle slate inactive states and crisp brand highlights without thick yellow border boxes.

## 2. Typography & Spacing
- **Font Pairing:**
  - Display/Headings: `Geist Sans`, `Inter`, or `system-ui` (600 SemiBold / 700 Bold, tracking `-0.02em`).
  - Body/UI: `Geist Sans`, `Inter`, or `system-ui` (400 Regular / 500 Medium).
  - Telemetry / Numbers / Coordinates: `Geist Mono`, `monospace` with `tabular-nums`.
- **Spacing Scale:** Strict 4pt grid (`4, 8, 12, 16, 20, 24, 32, 48, 64px`). Minimum `24px` whitespace between distinct content groups. Minimum touch target `44x44pt` (`48px` tactical standard).
- **Border Radius:** Consistent geometry:
  - Cards/Containers/Sheets: `12px` (`rounded-xl`).
  - Buttons/Inputs/Selectors: `8px` (`rounded-lg`).
  - Small Indicators/Chips: `6px` (`rounded-md`).
  - Badges/Pills/Avatars: `9999px` (`rounded-full`).

## 3. Anti-Slop Bans (Zero Tolerance)
- **NO** generic "Bento grids" with 6+ uniform boxes of equal visual weight.
- **NO** AI-cliché gradients (purple/indigo/cyan glows) or glassmorphism blurs over busy backgrounds.
- **NO** nested cards (never put a bordered card inside another bordered card).
- **NO** gratuitous icons next to every single heading or list item.
- **NO** bouncing/overshooting spring animations. Keep UI transitions snappy (`150ms–250ms`, ease-out).
