# DESLOP — Contrast & Readability Fix Log

All fixes use existing design tokens from `globals.css`. No layout or geometry changes.
WCAG AA target: ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI components.

---

## Phase 2 — Contrast & Readability

### 1. Buy button — focus ring invisible (both themes)

**Element:** Primary "Purchase Block" button — `app/blocks/[slug]/page.tsx`
**Before:** `focus-visible:ring-2 focus-visible:ring-offset-2` — no ring color or offset color specified. The focus ring was rendered in the browser's default accent color with no offset, making it invisible against both the white button (dark mode) and dark button (light mode).
**After:** Added `focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background`. Ring now uses `--metal-shine` (medium gray, 3:1+ contrast against both button colors), offset uses page background so the ring visually lifts off the button.
**Themes:** Both.

### 2. Secondary "View source preview" button — no focus ring

**Element:** Secondary button on block detail page — `app/blocks/[slug]/page.tsx`
**Before:** No `focus-visible:*` classes at all. Keyboard users had no visible focus indicator.
**After:** Added same `focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background` pattern.
**Themes:** Both.

### 3. Search input — focus ring missing color

**Element:** Search input on `/blocks` catalog — `app/blocks/page.tsx`
**Before:** `focus:ring-1` with no color (browser default, low contrast, no offset).
**After:** `focus-visible:ring-2 focus-visible:ring-metal-shine focus-visible:ring-offset-2 focus-visible:ring-offset-background` — consistent with button pattern.
**Themes:** Both.

### 4. Pricing CTA button — no focus ring

**Element:** "Browse blocks" and "Get All Access" buttons — `components/sections/PricingSection.tsx`
**Before:** No focus-visible styling at all.
**After:** Same ring pattern added.
**Themes:** Both.

### 5. InlineCode — invisible background in light mode

**Element:** `<InlineCode>` in all docs pages — `components/docs/CodeBlock.tsx`
**Before:** `background: rgba(255,255,255,0.06)` and `border: 1px solid rgba(255,255,255,0.08)`. In light mode these values are white-on-white: the code chip had no visible background or border at all.
**After:** `bg-black/[0.06] dark:bg-white/[0.06] border border-black/[0.1] dark:border-white/[0.08]` — dark-mode-aware using Tailwind's `dark:` variant. Code chips are now visually distinct from surrounding text in both themes.
**Themes:** Light mode fix; dark mode unchanged.

### 6. EnvTable — variable name column illegible in light mode

**Element:** Variable name `<td>` in `<EnvTable>` — `components/docs/CodeBlock.tsx`
**Before:** `color: "#79c0ff"` (GitHub dark-theme blue, ~2:1 contrast ratio against the light docs page background `#f8fafc`). Fails WCAG AA by a significant margin.
**After:** `color: hsl(var(--metal-foreground))` — theme-aware, ≥ 7:1 in light mode, ≥ 7:1 in dark mode.
**Themes:** Light mode fix; dark mode improved.

### 7. EnvTable — alternating row stripe invisible in light mode

**Element:** Alternating `<tr>` backgrounds in `<EnvTable>` — `components/docs/CodeBlock.tsx`
**Before:** `rgba(255,255,255,0.01)` — invisible in light mode (white on white) and barely visible in dark mode.
**After:** `bg-black/[0.03] dark:bg-white/[0.03]` via Tailwind dark: variant. Subtle but visible stripe in both themes.
**Themes:** Both.

---

## Elements verified as compliant (no fix needed)

| Element | Light | Dark | Notes |
|---|---|---|---|
| Buy button bg/text contrast | ✅ `#0f172a`/`#f8fafc` ~18:1 | ✅ `#fafafa`/`#09090b` ~20:1 | `bg-foreground text-background` resolves via CSS vars |
| Category badges (violet/amber/cyan/emerald) | ✅ | ✅ | Standard Tailwind tokens with dark: variants |
| Playground tabs / code viewer | N/A | ✅ fixed dark | Intentionally always-dark container; GH dark-theme palette |
| Devnet badge in previews | N/A | ✅ | Inside fixed-dark playground; cyan on #0d1117 ~5:1 |
| Pricing "All Access" CTA | ✅ white on violet | ✅ white on violet | Inline gradient with white text |
| PricingSection "Per Block" button | ✅ | ✅ | `--metal-gradient` bg + `--metal-foreground` text |
| Footer text & links | ✅ | ✅ | `--accent-mineral` + `--metal-shine` against page bg |
