# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** A live dashboard of Denys's real-world activity — not a resume, but a window into what he's building, playing, and listening to right now.
**Current focus:** Phase 2 — Data Contract + GitHub Stats

## Current Position

Phase: 2 of 5 (Data Contract + GitHub Stats)
Plan: 3 of 3 in current phase — COMPLETE
Status: Phase 2 complete — all 3 plans done; ProjectsSection, GitHubStatsSection, Footer, App.tsx wired and visually verified
Last activity: 2026-03-17 — visual verification approved by user; 02-03-SUMMARY.md finalized

Progress: [████████░░] 80%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 2.75 min
- Total execution time: 0.18 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 2 | 7 min | 3.5 min |
| 02-data-contract-github-stats | 3 | 14 min | 4.7 min |

**Recent Trend:**
- Last 5 plans: 01-01 (4 min), 01-02 (3 min), 02-01 (2 min), 02-02 (2 min), 02-03 (10 min)
- Trend: stable

*Updated after each plan completion*
| Phase 02-data-contract-github-stats P03 | 5 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Init]: React + Vite over Next.js — static site with no SSR needs; Vite simpler for GH Pages
- [Init]: GitHub Actions for data fetching — avoids exposing API keys client-side
- [Init]: data.json as data layer — single file read on page load, fast, no runtime API calls
- [Init]: Green (#00ff00) accent — used only for live/active states (terminal/gaming aesthetic)
- [01-01]: Used @types/node for process.env in vite.config.ts (TypeScript strict mode requirement)
- [01-01]: src/vite-env.d.ts required when manually scaffolding (noUncheckedSideEffectImports in TS 5.6)
- [01-01]: Social links use labeled placeholders — GITHUB_USERNAME, LINKEDIN_SLUG, EMAIL_ADDRESS
- [Phase 01-02]: Used official actions/deploy-pages@v4 pipeline with configure-pages@v5 for dynamic VITE_BASE_PATH injection
- [Phase 01-02]: One-time GitHub repo setup required: Settings > Pages > Source must be 'GitHub Actions' before first deploy succeeds
- [02-01]: All nullable fields use strict '| null' not optional '?' — TypeScript contract prevents silent undefined reads
- [02-01]: isStale threshold set at 30 minutes — aligns with Phase 5 PLAYING NOW suppression requirement
- [02-01]: public/data.json stub has steam_ok: false, spotify_ok: false — fallback UI paths are exercised on every local dev run
- [02-01]: useData() uses import.meta.env.BASE_URL consistent with HeroSection.tsx headshot image pattern
- [02-02]: GH_PAT (classic PAT) used instead of GITHUB_TOKEN — GITHUB_TOKEN may lack read:user scope for pinnedItems GraphQL
- [02-02]: Top languages derived from pinnedItems primaryLanguage (same GraphQL call) — all-repos accuracy deferred to Phase 5
- [02-02]: Year-boundary streak limitation accepted for v1 — contributionsCollection defaults to current calendar year
- [Phase 02-03]: Language color dots use inline style backgroundColor — dynamic Tailwind classes cannot be generated at runtime for hex values
- [Phase 02-03]: Intl.RelativeTimeFormat used for Footer relative timestamps — no date library needed

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3 prereq]: Steam profile privacy for Steam ID 76561198275331284 must be confirmed as "Public > Game details" before Steam fetch script can be tested. This is a user-account setting, not a code problem.
- [Phase 4 prereq]: Spotify refresh token initial setup requires a one-time manual OAuth flow to generate the refresh token. Needs a clear runbook before starting Phase 4.

## Session Continuity

Last session: 2026-03-17
Stopped at: Phase 2 complete — all 3 plans executed; ready to begin Phase 3 (Steam gaming)
Resume file: .planning/phases/03-steam-gaming/ (next phase)
