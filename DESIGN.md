# DESIGN SYSTEM & AESTHETIC RULES

## 1. Visual Identity & Tone
- **Aesthetic Direction:** Tactical Command Intelligence (Obsidian & Amber Gold) — A precision-engineered, mission-critical law enforcement and defense surveillance aesthetic. Dark-mode primary for 24/7 command center operations, tactile feedback, razor-sharp hairline borders, dense telemetry data hierarchy, and zero visual fluff.
- **Color Restraint (Strict 60-30-10 Rule):**
  - **Primary Canvas (60%):** `#090D16` (Dark / Command Center) / `#F8FAFC` (Light / Field Daylight) — Deep Obsidian Void, NEVER pure `#000000` or `#FFFFFF`.
  - **Elevated Surface (30%):** `#111726` (Dark Cards/Panels) & `#172033` (Elevated/Hover Tiers) / `#FFFFFF` (Light Cards) & `#F1F5F9` (Light Elevated).
  - **Single Brand Accent (10%):** `#F59E0B` (Tactical Amber Gold) — High-alert visibility, reserved strictly for primary interactive CTAs, verified match alerts, and active focal states. Never use for decorative background wash or borders.
  - **Tactical Telemetry & AI Signals:** `#06B6D4` (Tactical Cyan) — Reserved strictly for AI facial recognition confidence scores, live camera feeds, and radar pings.
  - **Status Accents:**
    - Confirmed / Secure: `#10B981` (Tactical Emerald)
    - Warning / Pending: `#F59E0B` (Amber Gold)
    - Critical Alert / Rejected: `#EF4444` (Tactical Crimson)
    - Operational Info: `#3B82F6` (Cobalt)
  - **Ink / Text Hierarchy:**
    - Dark Mode: Primary `#F8FAFC` (Slate 50), Secondary `#94A3B8` (Slate 400), Muted `#64748B` (Slate 500).
    - Light Mode: Primary `#0F172A` (Slate 900), Secondary `#475569` (Slate 600), Muted `#94A3B8` (Slate 400).
- **Borders & Depth:** Use crisp `1px` hairline borders (`rgba(255,255,255,0.08)` dark / `rgba(0,0,0,0.08)` light, or `#1E293B`) instead of muddy drop shadows.

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
