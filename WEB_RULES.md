# NEXT.JS WEB ARCHITECTURE & UI RULES

## Stack & Primitives
- **Styling:** Tailwind CSS mapped strictly to `DESIGN.md` CSS variables in `globals.css`. No arbitrary hex codes (`bg-[#...]`) in JSX.
- **Components:** Use `shadcn/ui` / Radix primitives. Compose clean, accessible components rather than custom div-soup.
- **Layout Discipline:**
  - Desktop max-width container: `1280px` with generous breathing room.
  - Establish clear visual hierarchy: 1 focal point per viewport. Use whitespace and typography weight to separate sections before reaching for borders or background fills.
- **Interactions & Motion:**
  - All interactive elements must have distinct `:hover`, `:focus-visible`, and `:active` (subtle `scale-[0.98]`) states.
  - Only animate GPU-composited properties (`transform`, `opacity`).
