# Requirements: Denys Tsinyk Personal Website

**Defined:** 2026-03-16
**Core Value:** A live dashboard of Denys's real-world activity — not a resume, but a window into what he's building, playing, and listening to right now.

## v1 Requirements

### Foundation

- [x] **FNDN-01**: Project scaffolds with Vite 6 + React 18 + TypeScript 5 + Tailwind CSS v4
- [x] **FNDN-02**: Site deploys to GitHub Pages automatically on push via `deploy.yml` workflow with correct Vite `base` path
- [x] **FNDN-03**: Canonical `data.json` schema is defined with TypeScript types in `src/types/data.ts` as the contract between pipeline and UI
- [x] **FNDN-04**: `useData()` hook loads `data.json` on mount and exposes loading, error, stale, and data states to all sections

### Professional

- [x] **PROF-01**: User sees "Denys Tsinyk" displayed prominently as the page header
- [x] **PROF-02**: User sees headshot photo displayed alongside name in the header section
- [x] **PROF-03**: User sees 3 work experience one-liners with no dates: "Software Engineer Intern @ NFL - Security automation", "Teaching Assistant @ Pitt - Data Structures & Algorithms", "Events Coordinator @ PittCSC"
- [x] **PROF-04**: Subtle gray dividers visually separate each major section

### Gaming

- [x] **GAME-01**: User sees top 5 most played Steam games sorted by total hours descending, each showing Steam capsule (wide rectangular) art and hours in "1,234 hours played" format with monospace font
- [x] **GAME-02**: If the currently playing game is in the top 5, that game card shows a green pulse glow and "PLAYING NOW" badge
- [x] **GAME-03**: If the currently playing game is NOT in the top 5, it is shown separately above the top 5 list with the same green pulse glow and "PLAYING NOW" treatment
- [x] **GAME-04**: Game covers have smooth hover state with slight scale-up and green glow effect

### Music

- [x] **MUSC-01**: User sees last 5 Spotify-listened tracks displayed as a horizontal scrollable row with square album art, track name, and artist name below each
- [x] **MUSC-02**: Each track is clickable and opens the Spotify track URL in a new tab
- [x] **MUSC-03**: If Spotify data is unavailable or the track array is empty, a graceful fallback state is shown instead of a blank section

### Projects

- [x] **PROJ-01**: User sees pinned GitHub repos auto-fetched via GitHub GraphQL, each card showing repo name, description, star count, and primary language badge
- [x] **PROJ-02**: Each project card is clickable and opens the GitHub repo URL in a new tab
- [x] **PROJ-03**: User sees a GitHub stats bar showing top languages and contribution streak pulled from GitHub API

### Social

- [x] **SOCL-01**: User sees footer with icon links for GitHub, LinkedIn, Email, and Steam profile

### Data Pipeline

- [x] **PIPE-01**: GitHub Actions `refresh-data.yml` workflow runs on a ~10-minute cron schedule, fetches Steam + Spotify + GitHub APIs using repo secrets, and commits updated `public/data.json` with `[skip ci]` to avoid triggering a rebuild
- [x] **PIPE-02**: `data.json` includes an `updated_at` ISO timestamp at the root level, displayed in the site footer so the user can verify data freshness
- [x] **PIPE-03**: `data.json` includes `steam_ok` and `spotify_ok` boolean flags; UI sections show a fallback state when the corresponding flag is `false`

## v2 Requirements

### Enhancements

- **UX-01**: Discord presence via Lanyard API (online/idle/DND status) — deferred, user did not select
- **UX-02**: Spotify live currently-playing ticker at page top — deferred, user did not select
- **UX-03**: Dark/light mode toggle — conflicts with brutalist aesthetic, defer
- **UX-04**: Contact form — not requested for v1

### Pipeline

- **PIPE-04**: `workflow_dispatch` trigger on `refresh-data.yml` to allow manual data refresh — useful guard against cron suspension but not blocking for v1

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side rendering / API routes | GitHub Pages is static-only; data fetched via GitHub Actions |
| Next.js | Unnecessary complexity for a static site; Vite is simpler |
| Dark/light mode toggle | Conflicts with brutalist minimal aesthetic |
| Blog / writing section | Not requested |
| Mobile app | Web-first only |
| Skills progress bars | Anti-pattern for this aesthetic — feels fake |
| Typewriter / animation effects | Anti-feature for data-forward brutalist vibe |
| Contact form | Not requested; email link in social section is sufficient |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FNDN-01 | Phase 1 | Complete |
| FNDN-02 | Phase 1 | Complete |
| FNDN-03 | Phase 2 | Complete |
| FNDN-04 | Phase 2 | Complete |
| PROF-01 | Phase 1 | Complete |
| PROF-02 | Phase 1 | Complete |
| PROF-03 | Phase 1 | Complete |
| PROF-04 | Phase 1 | Complete |
| SOCL-01 | Phase 1 | Complete |
| PIPE-01 | Phase 2 | Complete |
| PIPE-02 | Phase 2 | Complete |
| PIPE-03 | Phase 2 | Complete |
| PROJ-01 | Phase 2 | Complete |
| PROJ-02 | Phase 2 | Complete |
| PROJ-03 | Phase 2 | Complete |
| GAME-01 | Phase 3 | Complete |
| GAME-02 | Phase 3 | Complete |
| GAME-03 | Phase 3 | Complete |
| MUSC-01 | Phase 4 | Complete |
| MUSC-02 | Phase 4 | Complete |
| MUSC-03 | Phase 4 | Complete |
| GAME-04 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation — PROJ-01/02/03 moved to Phase 2 (GitHub stats integrated with data contract), GAME-04 moved to Phase 5 (hover polish applied after all sections exist)*
