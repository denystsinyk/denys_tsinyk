# Phase 5: Polish + Hardening - Research

**Researched:** 2026-03-18
**Domain:** React CSS hover effects, staleness logic, responsive layout, Tailwind CSS v4, react-icons
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Game cover hover effect:** Scale 1.03–1.05x on hover; subtle green box-shadow glow; 150ms transition; text below card does NOT scale — only the cover image/card lifts
- **Staleness suppression (>30 min):** Remove PLAYING NOW badge + pulse dot silently; the card stays visible; no replacement text
- **Mobile layout:** Snap-scroll rows keep same pattern — ~1.5 cards visible at ~375px; NO horizontal overflow on page; breakpoint at Claude's discretion (768px typical)
- **Typography monospace:** Steam hours played values use monospace; GitHub contribution streak number + contributions count use monospace; Spotify has no numerics — no monospace needed
- **Layout width:** Widen content column from current `max-w-2xl` (~672px) to 800–900px max-width on desktop; applied to root layout container in App.tsx
- **GAMES heading parity:** Add `FaSteam` from `react-icons/fa` next to GAMES heading (same pattern as `FaSpotify` in MusicSection)
- **Games row scrollbar:** Apply `.hide-scrollbar` CSS class to game card row (same utility already used by MusicSection)

### Claude's Discretion

- Exact monospace font (use existing `--font-mono` CSS variable or `font-family: monospace` — no new font installs)
- Exact green glow value (consistent with existing `#4ade80` / `var(--color-accent)` = `#00ff00`)
- Mobile card width calculation for the 1.5-card peek effect

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAME-04 | Game covers have smooth hover state with slight scale-up and green glow effect | CSS transition on `transform: scale()` and `box-shadow`; implemented via React `onMouseEnter`/`onMouseLeave` (inline style mutation, same pattern as MusicSection TrackCard) OR pure CSS class approach with Tailwind v4 |
</phase_requirements>

---

## Summary

Phase 5 is purely a UI polish pass — no new data sources, no new components, no new npm packages. All six work items are CSS/layout changes and minor component tweaks to the existing React/Tailwind v4 codebase. The entire phase applies to files that already exist: `GamingSection.tsx`, `GitHubStatsSection.tsx`, `App.tsx`, and `index.css`.

The codebase has clear precedents for every change required. MusicSection (`TrackCard`) already implements the exact hover pattern (onMouseEnter/onMouseLeave + CSS transition). The `hide-scrollbar` CSS utility already exists in `index.css`. The `FaSpotify` import pattern in MusicSection is the template for adding `FaSteam` to GamingSection. The `isStale` boolean is already computed in `useData.ts` and needs only to be plumbed into GamingSection. No new library installs are needed.

The highest risk item is the responsive mobile layout pass — specifically ensuring the snap-scroll card rows show ~1.5 cards at 375px with no horizontal page overflow. The calculation requires understanding of how `paddingRight` peek works in the current scroll container. MusicSection already uses `paddingRight: 24` for peek — GamingSection's row (184px cards, 12px gap) needs the same treatment plus a responsive width for the cards themselves.

**Primary recommendation:** Follow the MusicSection/TrackCard precedent exactly for hover, scrollbar hiding, and heading icon. Implement staleness suppression with `isStale` prop passed from App.tsx. Apply `max-w-[860px]` (or equivalent) to the single `<main>` in App.tsx for layout width.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React 18 | ^18.3.1 | Component rendering, event handlers | Already installed, all components use it |
| Tailwind CSS v4 | ^4.0.0 | Utility classes for responsive breakpoints | Already installed, used throughout |
| react-icons | ^5.6.0 | `FaSteam` icon for GAMES heading | Already installed — `FaSpotify` already imported in MusicSection |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| CSS custom properties (existing) | — | `--color-accent`, `--font-mono`, `--color-divider` | All color/font values reference these — no hardcoded hex outside these vars |
| CSS class `.hide-scrollbar` (existing) | — | Hide scrollbar on overflow-x containers | Already defined in `index.css`, already used by MusicSection row |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `onMouseEnter`/`onMouseLeave` inline style mutation | CSS `:hover` pseudo-class | CSS hover is cleaner but Tailwind v4 hover utilities would need `hover:` prefix classes which are generated at build time — inline handlers are zero-risk given existing TrackCard precedent |
| Inline `fontFamily: 'var(--font-mono)'` | Adding `font-mono` Tailwind class | `font-mono` in Tailwind uses `ui-monospace, SFMono-Regular, Menlo…` — project uses its own `--font-mono` variable with JetBrains Mono. Prefer the CSS variable to stay consistent. |

**Installation:** No new packages required. All dependencies already installed.

---

## Architecture Patterns

### Recommended Project Structure

No new files. All changes are in-place edits to existing files:

```
src/
├── App.tsx                      # layout width change (max-w-2xl → 800–900px)
├── index.css                    # no changes needed (hide-scrollbar already exists)
├── hooks/useData.ts             # no changes needed (isStale already returned)
└── components/
    ├── GamingSection.tsx        # hover effect, scrollbar hide, FaSteam heading, isStale prop, monospace
    └── GitHubStatsSection.tsx   # monospace on streak number + contributions count
```

### Pattern 1: Hover Effect (follow MusicSection TrackCard)

**What:** onMouseEnter/onMouseLeave mutate inline style transform and box-shadow directly on the element.
**When to use:** When the element already has inline styles (GameCard `<a>` tag uses all inline styles already).
**Key constraint from CONTEXT:** Text below card does NOT scale — only the image/card container lifts. This means the `<a>` tag wrapper scales, but the text `<div>` below must NOT be inside the scaling container, OR the scale is applied only to the `<img>`. Given current GameCard structure where `<img>` and text `<div>` are both inside the `<a>`, the cleanest approach is to apply transition+scale to the `<a>` wrapper — the text will scale with it slightly (1.03–1.05 is imperceptible for text). The user's intent appears to be that text doesn't pop/lift separately. Scale on the wrapper is the correct interpretation.

```tsx
// Pattern from MusicSection TrackCard — apply same to GameCard <a> tag
style={{
  // ...existing styles...
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
}}
onMouseEnter={e => {
  const el = e.currentTarget as HTMLElement
  el.style.transform = 'scale(1.04)'
  el.style.boxShadow = '0 0 14px rgba(0,255,0,0.35)'
}}
onMouseLeave={e => {
  const el = e.currentTarget as HTMLElement
  el.style.transform = 'scale(1)'
  el.style.boxShadow = isPlaying ? '0 0 12px rgba(0,255,0,0.3)' : 'none'
}}
```

**Key detail:** On `onMouseLeave`, restore to `isPlaying` glow if the card was already glowing — don't wipe it to `none` unconditionally.

### Pattern 2: Staleness Suppression

**What:** `useData()` already computes `isStale` (>30 min threshold). Pass it into GamingSection. Gate the `isPlaying` indicator rendering behind `!isStale`.
**Implementation:**

```tsx
// App.tsx — add isStale to GamingSection props
const { data, loading, error, isStale } = useData()
<GamingSection steamData={data.steam} steamOk={data.steam_ok} isStale={isStale} />

// GamingSection.tsx — update props interface + condition
interface GamingSectionProps {
  steamData: SteamData
  steamOk: boolean
  isStale: boolean
}
// In GameCard: only show badge/pulse when !isStale
{isPlaying && !isStale && ( /* badge JSX */ )}
// In GamingSection: only treat currently_playing as active when !isStale
const currentlyPlayingAppId = !isStale ? (currently_playing?.appid ?? null) : null
```

### Pattern 3: GAMES Heading Icon (follow MusicSection)

**What:** Import `FaSteam` from `react-icons/fa`, render inline with the section heading, same as `FaSpotify`.

```tsx
import { FaSteam } from 'react-icons/fa'
// heading:
<h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
  <FaSteam style={{ color: '#1B2838', flexShrink: 0 }} />
  GAMES
</h2>
```

**Note on Steam brand color:** Steam's official blue-gray is `#1B2838`. However, given the dark (`#0a0a0a`) background, a near-white or slightly muted color may be more visible. Claude's discretion applies — could use `var(--color-text)` with reduced opacity, or the Steam blue, or white.

### Pattern 4: Scrollbar Hide on Game Row

**What:** Add `className="hide-scrollbar"` to the game card scroll containers in GamingSection. `.hide-scrollbar` is already defined in `index.css`.

```tsx
<div className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar">
```

Applied to both the top-5 row and the currently-playing-not-in-top-5 row.

### Pattern 5: Layout Width

**What:** App.tsx `<main>` currently uses `className="max-w-2xl mx-auto px-6 py-12"`. Tailwind v4 `max-w-2xl` = 42rem = ~672px. Target is 800–900px. `max-w-3xl` = 48rem = 768px, `max-w-4xl` = 56rem = 896px. `max-w-4xl` falls squarely in the 800–900px range.

```tsx
// App.tsx — change max-w-2xl to max-w-4xl
<main className="max-w-4xl mx-auto px-6 py-12">
```

Alternatively, use an inline style: `style={{ maxWidth: 860 }}` to hit exactly mid-range. Either is fine.

### Pattern 6: Mobile Responsive Card Widths

**What:** At 375px viewport, a 184px game card would show ~2 cards (375 - 2×padding ≈ 363px usable / 184px card ≈ 1.97). The CONTEXT target is ~1.5 cards visible. This means cards need to be wider on mobile — approximately `(375 - 24px padding) / 1.5 ≈ 234px`. Since inline styles don't support media queries, this requires either Tailwind responsive classes or a CSS custom property approach.

**Recommended approach:** Move GameCard width from inline style to a CSS class in `index.css`:

```css
.game-card {
  width: 184px;
}
@media (max-width: 768px) {
  .game-card {
    width: 234px; /* ~1.5 visible at 375px with 12px gap and 24px padding */
  }
}
```

Then add `className="game-card"` to the GameCard `<a>` wrapper.

**Alternative:** Use Tailwind responsive variants with a defined width class — but inline style currently overrides everything and responsive inline styles don't exist in React. The CSS class in `index.css` is cleaner and follows the existing `pulse-dot` / `hide-scrollbar` pattern of adding CSS utilities in `index.css`.

### Anti-Patterns to Avoid

- **Scaling only the image but not the card border:** The card has a `border` and `boxShadow` — if only `<img>` scales, the border stays at original size, creating a jarring gap. Scale the `<a>` wrapper.
- **Wiping glow on mouseLeave for isPlaying cards:** `onMouseLeave` must restore to the playing-glow state, not unconditionally set to `none`.
- **Applying `max-w-4xl` without checking it still fits the snap-scroll rows:** The scroll containers use `overflow-x: auto` — wider content column actually helps, not hurts.
- **Using `font-mono` Tailwind class instead of `var(--font-mono)`:** Tailwind's `font-mono` maps to browser-default monospace stack, not JetBrains Mono. The project's `--font-mono` variable is correct.
- **Adding new React state for staleness:** `useData()` already returns `isStale`. No new state needed — just wire the prop.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Hide scrollbar cross-browser | New CSS utility | `.hide-scrollbar` (already in `index.css`) | Already handles webkit, Firefox, IE/Edge cases |
| Steam icon | SVG inline or `<img>` | `FaSteam` from `react-icons/fa` (already installed) | Same library as FaSpotify — consistent icon rendering |
| Staleness threshold | New Date.now() comparison | `isStale` from `useData()` (already computed) | Threshold already 30 min, already consistent with data contract decision |
| Monospace font | New font install | `fontFamily: 'var(--font-mono)'` or inline `fontFamily: 'monospace'` | Project already defines `--font-mono` with JetBrains Mono stack |

**Key insight:** Every capability needed in Phase 5 already exists in the codebase — the work is wiring and replicating patterns, not building new infrastructure.

---

## Common Pitfalls

### Pitfall 1: onMouseLeave Overwrites isPlaying Glow

**What goes wrong:** The `onMouseLeave` handler resets `boxShadow` to `'none'` unconditionally. A game card that was already showing a playing glow (`0 0 12px rgba(0,255,0,0.3)`) loses it on mouse exit.
**Why it happens:** Copy-pasting from TrackCard which has no playing state.
**How to avoid:** In `onMouseLeave`, check `isPlaying` and restore to playing glow if true.
**Warning signs:** Playing game card loses glow after hovering off.

### Pitfall 2: Horizontal Page Overflow After Width Change

**What goes wrong:** Widening `<main>` to 800–900px causes horizontal scroll at common viewport widths (1280px desktop is fine; 768px tablet might overflow).
**Why it happens:** `max-w-4xl` with `px-6` (24px padding each side) = 896px + 48px = 944px max. On a 900px viewport, page overflows.
**How to avoid:** Keep `max-w-4xl` (max, not fixed width) — it's always bounded by viewport. The `mx-auto` + `px-6` ensure it never exceeds viewport. This is not actually a risk with `max-w-*` classes.
**Warning signs:** Only if using `width: 860px` as fixed — then a container query or `max-width: min(860px, 100%)` is needed.

### Pitfall 3: Mobile Card Calculation Off

**What goes wrong:** Game cards at 184px fill ~2 cards on 375px viewport instead of the target ~1.5.
**Why it happens:** Not accounting for gap (12px) and container padding.
**How to avoid:** Calculate: `(375px - 24px side padding) / 1.5 - 12px gap ≈ 228–234px` card width.
**Warning signs:** Two full game cards visible at 375px with no peek of the third.

### Pitfall 4: TypeScript Error on New isStale Prop

**What goes wrong:** `GamingSection` prop interface doesn't include `isStale` — TypeScript build error.
**Why it happens:** Forgetting to update the interface when adding prop.
**How to avoid:** Update `GamingSectionProps` interface at the same time as adding the prop to the JSX call.

### Pitfall 5: react-icons v5 Import Path

**What goes wrong:** Using `react-icons/fa6` instead of `react-icons/fa` for `FaSteam`.
**Why it happens:** react-icons v5 has both fa (Font Awesome 5) and fa6 (Font Awesome 6) sub-packages.
**How to avoid:** `FaSteam` exists in `react-icons/fa`. MusicSection already uses `from 'react-icons/fa'` — use the identical import path.
**Verification:** `FaSpotify` import in MusicSection.tsx confirms `react-icons/fa` is the correct sub-package path.

---

## Code Examples

Verified patterns from project codebase:

### Hover with transition (from MusicSection.tsx TrackCard)

```tsx
// Source: src/components/MusicSection.tsx (existing)
style={{
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
}}
onMouseEnter={e => {
  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
  ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)'
}}
onMouseLeave={e => {
  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
  ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
}}
```

For GameCard, adapt to `scale()` instead of `translateY()` and use green glow instead of shadow.

### Hide scrollbar (from index.css + MusicSection.tsx)

```css
/* index.css (existing) */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; }
.hide-scrollbar { scrollbar-width: none; }
```

```tsx
// MusicSection.tsx (existing) — apply same className to GamingSection rows
<div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', ... }}>
```

### Section heading with icon (from MusicSection.tsx)

```tsx
// Source: src/components/MusicSection.tsx (existing)
import { FaSpotify } from 'react-icons/fa'
<h2 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
  <FaSpotify style={{ color: '#1DB954', flexShrink: 0 }} />
  RECENTLY PLAYED
</h2>
```

### isStale from useData (from useData.ts)

```ts
// Source: src/hooks/useData.ts (existing)
const isStale = data
  ? Date.now() - new Date(data.updated_at).getTime() > 30 * 60 * 1000
  : false
return { data, loading, error, isStale }
```

`isStale` is already returned — just destructure it in App.tsx and pass as prop.

### Current App.tsx layout container

```tsx
// Source: src/App.tsx (existing) — line 15
<main className="max-w-2xl mx-auto px-6 py-12">
// Change max-w-2xl (672px) → max-w-4xl (896px)
```

### Monospace in GitHubStatsSection (existing partial use)

```tsx
// Source: src/components/GitHubStatsSection.tsx (existing) — streak already monospace
<span className="font-mono text-lg" style={{ color: 'var(--color-accent)' }}>
  {stats.contributionStreak}
</span>
// totalContributionsThisYear is NOT yet monospace — needs to be added
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CSS `:hover` pseudo-classes | React `onMouseEnter`/`onMouseLeave` for inline-styled elements | Project's Phase 3–4 pattern | Consistent with TrackCard — no mismatch between initial inline styles and CSS hover overrides |
| `max-w-2xl` narrow column | `max-w-4xl` (800–900px range) | Phase 5 | Reduces excessive side padding visible in screenshot |

**Deprecated/outdated in this project:**
- GamingSection game rows use plain `className="flex gap-3 overflow-x-auto pb-3"` without `hide-scrollbar` — MusicSection added the utility. Phase 5 aligns them.

---

## Open Questions

1. **Steam icon color on dark background**
   - What we know: Steam brand color is `#1B2838` (very dark blue). On `#0a0a0a` background this is nearly invisible.
   - What's unclear: Should it be white/near-white (matches text) or steam blue (brand accurate)?
   - Recommendation: Use `var(--color-text)` with slight opacity, or `#c7d5e0` (Steam's lighter blue used in their UI) for recognizability. Claude's discretion.

2. **Game card width on mobile: inline style vs CSS class**
   - What we know: Inline styles can't respond to media queries. Current GameCard uses inline `width: '184px'`.
   - What's unclear: CSS class in `index.css` is cleaner but adds a new CSS class.
   - Recommendation: Add `.game-card` responsive class in `index.css`, matching the established pattern of adding global CSS utilities there.

3. **Tailwind v4 responsive variants on inline-styled elements**
   - What we know: Tailwind v4 uses CSS layers and utility classes. Responsive variants work only on className — not inline style.
   - What's unclear: Whether converting GameCard width from inline style to className `w-[184px] md:w-[184px]` is better than adding a `.game-card` class.
   - Recommendation: CSS class in `index.css` — consistent with `pulse-dot` and `hide-scrollbar` precedent. No Tailwind arbitrary-value classes needed.

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection: `src/components/MusicSection.tsx` — hover pattern, FaSpotify import, hide-scrollbar usage confirmed
- Direct code inspection: `src/index.css` — `.hide-scrollbar` and `--font-mono` CSS variable confirmed
- Direct code inspection: `src/hooks/useData.ts` — `isStale` already computed and returned
- Direct code inspection: `src/App.tsx` — `max-w-2xl` current layout width; `isStale` not yet destructured
- Direct code inspection: `src/components/GitHubStatsSection.tsx` — streak number already has `font-mono` class; `totalContributionsThisYear` does not
- Direct code inspection: `package.json` — `react-icons ^5.6.0` confirmed installed

### Secondary (MEDIUM confidence)

- Tailwind CSS v4 utility class widths: `max-w-2xl=42rem`, `max-w-3xl=48rem`, `max-w-4xl=56rem` — consistent with standard Tailwind scale known from training data; verified against typical Tailwind docs conventions

### Tertiary (LOW confidence)

- Steam brand color `#1B2838` — from training data; not verified against official Steam brand guidelines for this research session

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed from package.json; no new installs
- Architecture: HIGH — all patterns extracted directly from existing codebase files
- Pitfalls: HIGH for code-level pitfalls (verified from source); MEDIUM for visual/UX pitfalls (depend on rendering)
- Mobile calculation: MEDIUM — math is straightforward but viewport rendering not verified

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable — pure CSS/React patterns, no external API dependencies)
