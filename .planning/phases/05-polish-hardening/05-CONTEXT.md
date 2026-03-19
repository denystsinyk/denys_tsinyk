# Phase 5: Polish + Hardening - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply visual and interactive refinements across all sections — hover states on game covers, staleness suppression of live indicators, responsive mobile layout, and typography consistency. Also includes layout width fix and parity fixes observed in the screenshot (Steam logo on GAMES heading, scrollbar hidden on game card row). No new data sources or sections.

</domain>

<decisions>
## Implementation Decisions

### Game cover hover effect
- Scale: 1.03–1.05x on hover (very slight lift)
- Glow: subtle green box-shadow — soft, not harsh
- Transition: 150ms — snappy, not sluggish
- Text below card does NOT scale — only the cover image/card lifts

### Staleness suppression (>30 min old)
- Remove PLAYING NOW badge + pulse dot silently
- The currently-playing card itself stays visible — only live indicators disappear
- No replacement text — silent removal, no "Last played" label or explanation

### Mobile layout
- Snap-scroll rows (Games, Music) keep the same pattern — narrower cards, ~1.5 cards visible at ~375px
- Hard constraint: NO horizontal overflow on the page itself — nothing causes the page to scroll sideways
- Breakpoint: Claude's discretion (768px typical)

### Typography — monospace font
- Steam hours played values: monospace (e.g. `3,166 hrs`)
- GitHub contribution streak number + contributions count: monospace (e.g. `3 day streak`, `347 contributions`)
- Spotify section: no numeric values displayed — no monospace needed

### Layout width
- Widen content column from current narrow width to 800–900px max-width on desktop
- Reduces the excessive side padding visible in the screenshot
- Applied to the root layout container (App.tsx or index.css), affects all sections uniformly

### GAMES section parity fixes (from screenshot)
- Add Steam logo next to GAMES heading — use `FaSteam` from `react-icons/fa` (already installed, same pattern as `FaSpotify` in MusicSection)
- Hide the browser scrollbar on the game card row — apply `.hide-scrollbar` CSS class (same utility used by MusicSection)

### Claude's Discretion
- Exact monospace font (use existing stack or `font-family: monospace` — no new font installs)
- Exact green glow value (stay consistent with existing green accent `#4ade80` or equivalent)
- Mobile card width calculation for the 1.5-card peek

</decisions>

<specifics>
## Specific Ideas

- "Tons of padding on the side" — content column is too narrow; 800–900px max-width targets this directly
- Games section should mirror the MusicSection heading pattern: logo + ALL-CAPS section name
- Scrollbar should not be visible on the game row (user saw the native browser scrollbar in the screenshot)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-polish-hardening*
*Context gathered: 2026-03-18*
