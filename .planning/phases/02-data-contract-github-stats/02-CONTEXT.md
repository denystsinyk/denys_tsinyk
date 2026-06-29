# Phase 2: Data Contract + GitHub Stats - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock the `data.json` schema as the typed architectural contract for all phases, and render live GitHub data (pinned repos + stats) fetched by the GitHub Actions pipeline. Steam and Spotify sections are scaffolded in the schema but not yet populated. This phase does not implement Steam or Spotify fetching — those are Phases 3 and 4.

</domain>

<decisions>
## Implementation Decisions

### Repo Card Layout
- Grid layout: 2-3 columns (responsive), GitHub-profile-style arrangement
- One line of description per card, truncated with ellipsis if too long
- Language badge: GitHub-style colored dot + language name (e.g., ● TypeScript)
- Star count shown on each card
- Clicking a card opens the repo in a new tab

### Schema Design
- Stub Steam and Spotify fields in data.json now (steam_ok, spotify_ok, steam: {}, spotify: {}) — typed but empty — so fallback logic works from Phase 2 onward
- TypeScript types use strict nullability: `currently_playing: string | null`, not optional `?` fields — forces null handling in all components
- GitHub username and other config live in GitHub Actions env vars / repo variables (never hardcoded)
- Pipeline fetches up to 6 pinned repos (GitHub's default pinned limit) to fill a 2×3 or 3×2 grid

### Fallback States
- When `steam_ok` is false: gaming section remains visible with a subtle "gaming stats unavailable" message — honest about the state, not hidden
- When `spotify_ok` is false: music section remains visible with a "music unavailable" message — consistent with gaming fallback
- Footer `updated_at` shows relative time: "updated 8 minutes ago" — human-readable freshness indicator
- If the GitHub fetch fails: pipeline keeps existing data.json unchanged (silent last-good-data), the `updated_at` timestamp reveals staleness — no explicit github_ok flag needed

### Claude's Discretion
- Exact wording of fallback messages (e.g., "gaming stats unavailable" vs "Steam data unavailable")
- Visual style of fallback placeholder (subtle gray text vs bordered placeholder card)
- Top languages bar and contribution streak visual design (bar chart, pills, or ranked list)
- Loading skeleton approach (if any) during initial page render

</decisions>

<specifics>
## Specific Ideas

- Repo cards should feel like GitHub's own pinned repo cards — familiar to developers visiting the portfolio
- The updated_at footer timestamp is the data freshness signal — it should be visually subtle but present on every page load

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-data-contract-github-stats*
*Context gathered: 2026-03-17*
