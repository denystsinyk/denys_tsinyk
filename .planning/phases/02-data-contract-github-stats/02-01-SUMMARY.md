---
phase: 02-data-contract-github-stats
plan: 01
subsystem: api
tags: [typescript, react, vite, hooks, data-contract]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: React + Vite project scaffold with TypeScript strict mode configured
provides:
  - Canonical TypeScript interfaces for all data.json consumers (7 interfaces)
  - useData() React hook for fetching and exposing typed site data
  - public/data.json stub with correct schema shape for local development
affects: [03-steam-integration, 04-spotify-integration, 05-ui-polish, all phase 2 components]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Strict '| null' nullability over optional '?' fields — forces explicit null handling in all components
    - import.meta.env.BASE_URL for fetch paths to support GitHub Pages subpath routing
    - isStale computed from updated_at timestamp (30-minute threshold) for data freshness signaling

key-files:
  created:
    - src/types/data.ts
    - src/hooks/useData.ts
    - public/data.json
  modified: []

key-decisions:
  - "All nullable fields use strict '| null' not optional '?' — enforced TypeScript contract prevents silent undefined reads"
  - "isStale threshold set at 30 minutes — matches Phase 5 requirement to suppress stale PLAYING NOW indicators"
  - "public/data.json stub has steam_ok: false, spotify_ok: false — fallback UI works correctly from Phase 2 onward"
  - "useData() uses import.meta.env.BASE_URL consistent with HeroSection.tsx headshot image pattern"

patterns-established:
  - "Pattern 1: Data contract as single source of truth — all components import from src/types/data.ts, never define inline types"
  - "Pattern 2: BASE_URL fetch — fetch(`${import.meta.env.BASE_URL}data.json`) is the canonical pattern for static assets"
  - "Pattern 3: Strict nullability — '| null' not '?' for all optional data fields from external APIs"

requirements-completed: [FNDN-03, FNDN-04, PIPE-03]

# Metrics
duration: 2min
completed: 2026-03-17
---

# Phase 2 Plan 01: Data Contract + GitHub Stats Summary

**7-interface TypeScript data contract with strict null types and useData() hook using import.meta.env.BASE_URL for GitHub Pages subpath support**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T15:29:04Z
- **Completed:** 2026-03-17T15:30:23Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Defined 7 TypeScript interfaces (PinnedRepo, GitHubStats, SteamGame, SteamData, SpotifyTrack, SpotifyData, SiteData) as the canonical data contract — all Phases 2-5 components must import from this file
- Implemented useData() hook returning { data, loading, error, isStale } with correct TypeScript types, using BASE_URL for GitHub Pages compatibility
- Seeded public/data.json stub with steam_ok: false, spotify_ok: false enabling fallback UI to render correctly from day one

## Task Commits

Each task was committed atomically:

1. **Task 1: Define TypeScript data contract and seed stub data.json** - `280154b` (feat)
2. **Task 2: Implement useData() hook** - `2ccb653` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/types/data.ts` - 7 exported interfaces; canonical schema contract for all data.json consumers
- `src/hooks/useData.ts` - useData() hook; fetches data.json via BASE_URL, returns typed result with isStale
- `public/data.json` - Development stub matching SiteData shape; steam_ok/spotify_ok set to false

## Decisions Made
- All nullable fields use `| null` not `?` — TypeScript strict mode will catch any field access without explicit null check
- isStale threshold is 30 minutes — aligns with Phase 5 requirement to suppress stale "PLAYING NOW" indicators
- steam_ok/spotify_ok set to false in stub — fallback UI paths are exercised on every local dev run, not just in production
- Used import.meta.env.BASE_URL consistent with existing HeroSection.tsx pattern (previously established in Phase 1)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TypeScript contract is locked — Phase 2 components can now safely import from src/types/data.ts
- useData() hook is ready for consumption in GitHub stats components
- Stub data.json allows local dev to work without a real data pipeline
- Phase 2 Plan 02 (GitHub Actions pipeline) can proceed: the schema is the single source of truth the pipeline must produce

---
*Phase: 02-data-contract-github-stats*
*Completed: 2026-03-17*
