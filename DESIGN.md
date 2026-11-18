# GARUDA A.S.T.R.A — DESIGN SYSTEM & VISUAL CONTRACT

## 1. Visual Identity & Brand Essence
- **Aesthetic Direction:** Grand Imperial Gold (Garuda Sovereign Intelligence) — A majestic, authoritative, precision-engineered defense and sovereign intelligence aesthetic. Grounded in the divine vigilance, celestial golden wings, and sovereign authority of the celestial Garuda.
- **Tone & Mood:** Grand, commanding, high-contrast, deep velvet bronze-obsidian canvas paired with rich, burnished metallic gold. Zero "AI-slop" tells, zero fake sci-fi cyberpunk glows, zero tacky yellow cards.
- **Color Discipline (Strict 60-30-10 Rule):**
  - **Primary Canvas (60%):** `#0A0908` (Deep Imperial Bronze-Obsidian) / `#FAFAF9` (Daylight Stone) — Warm velvet void, high clarity, completely free of muddy blue-black or gray wash.
  - **Elevated Surfaces (30%):** `#131210` (Surface Panels/Cards) & `#1B1916` (Elevated/Hover Tiers) / `#FFFFFF` (Light Surface) & `#F5F5F4` (Light Elevated).
  - **Sovereign Brand Accent (10%):** `#D4AF37` (Imperial Burnished Gold) / Highlight `#E8C86A` (Celestial Sunlight Gold) — The majestic focal accent, reserved strictly for primary interactive CTAs, verified match indicators, and active selection states.
  - **Status Signals (Functional, Restrained):**
    - Critical Threat / Wanted / Rejected: `#E11D48` (Imperial Crimson)
    - Match Alert / Priority Lead: `#D4AF37` (Imperial Gold)
    - Confirmed / Secure / Nominal: `#10B981` (Sovereign Emerald)
    - Telemetry / Sensor Stream: `#38BDF8` (Precision Sky)
  - **Ink / Typography Hierarchy:**
    - Dark Mode: Primary `#FBF7EE` (Warm Champagne White — crisp, elegant, zero glare), Secondary `#A8A29E` (Stone 400), Muted `#78716C` (Stone 500).
    - Light Mode: Primary `#0C0A09` (Stone 950), Secondary `#44403C` (Stone 700), Muted `#78716C` (Stone 500).
- **Borders & Rules:** Razor-sharp hairline borders (`rgba(212, 175, 55, 0.15)` dark / `rgba(212, 175, 55, 0.25)` subtle or `rgba(255, 255, 255, 0.08)`) delivering high-craft tactile structure without muddy drop shadows.

## 2. Anti-Slop Craft Floor (Zero Tolerance)
- **NO All-Caps Eyebrow Kickers:** Ban all arbitrary uppercase labels above headings (e.g. no `MISSING PERSON — CAMERA MATCH` or `TACTICAL EXCEPTION`). Let the target's identity and status chips speak for themselves.
- **NO "Everything's a Card":** Ban wrapping every single list row into identical thick-bordered boxes with nested action buttons. Use Inset-Grouped Lists with refined hairline separators (`StyleSheet.hairlineWidth`).
- **NO Dual Buttons per Row:** List rows are tap-to-inspect targets (`Pressable` with subtle highlight). Actions belong in context drawers or the detail view.
- **NO Cliché Neon Cyan/Cyber Gimmicks:** No neon perimeter glows, scanline grids, or decorative fake coordinate widgets.
- **NO Tacky Yellow Tab Bars:** Navigation uses deep imperial obsidian with warm champagne labels and burnished gold active pips.
