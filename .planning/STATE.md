# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-16)

**Core value:** A live dashboard of Denys's real-world activity — not a resume, but a window into what he's building, playing, and listening to right now.
**Current focus:** Phase 5 complete — project v1 done

## Current Position

Phase: 5 of 5 (Polish + Hardening)
Plan: 2 of 2 in current phase — COMPLETE
Status: Phase 5 complete — all v1 requirements satisfied; 05-02 human verification passed (all 7 visual checks ok)
Last activity: 2026-03-18 — 05-02-SUMMARY.md finalized; human visual sign-off on hover effects, staleness gating, FaSteam icon, no scrollbar, wider layout, mobile peek, monospace typography

Progress: [██████████] 100%

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
| Phase 04-spotify-integration P01 | 2 | 2 tasks | 3 files |
| Phase 04-spotify-integration P02 | 2 | 2 tasks | 3 files |
| Phase 04-spotify-integration P03 | human-gated | 2 tasks | 0 files |

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
- [03-02]: pulse-dot animation uses CSS class in index.css, not Tailwind — keyframe animations cannot be generated at runtime
- [03-02]: Steam capsule art always uses CDN header.jpg from appid — never img_icon_url (32x32 icon hash)
- [Phase 03-01]: Steam script uses read-patch-write (not full overwrite) — preserves GitHub data written by prior workflow step
- [Phase 03-01]: On Steam fetch failure steam_ok=false but existing steam data preserved — last good state survives transient errors
- [Phase 03-01]: parseInt(player.gameid, 10) required for appid matching — GetPlayerSummaries gameid is string, owned game appid is number
- [Phase 03-03]: GamingSection handles steam_ok=false fallback internally — App.tsx renders unconditionally, no wrapper conditional needed
- [Phase 04-01]: Spotify script uses read-patch-write (not full overwrite) — same pattern as Steam script, preserves GitHub/Steam data
- [Phase 04-01]: On Spotify fetch failure spotify_ok=false but existing spotify data preserved — last good state survives transient errors
- [Phase 04-01]: currently_playing: null always in Spotify data — Phase 4 spec defers currently-playing music indicator to v2
- [Phase 04-01]: Refresh token rotation handled as console.warn only — GitHub Secrets cannot be auto-updated from pipeline
- [Phase 04-02]: MusicSection handles its own fallback internally — App.tsx renders unconditionally, matching GamingSection pattern
- [Phase 04-02]: TrackCard is an <a> tag so each card is a native link to spotify_url, no JS navigation needed
- [Phase 04-02]: paddingRight: 24 for peek effect — horizontal snap-scroll row with scrollSnapType:x mandatory and per-card scrollSnapAlign:start
- [Phase 04-03]: Spotify OAuth completed successfully — refresh token valid and stored in GitHub Secrets; pipeline confirmed spotify_ok: true with 5 tracks
- [Phase 05-01]: onMouseLeave restores boxShadow to playing glow not 'none' — unconditional reset breaks live indicator on any mouse-leave
- [Phase 05-01]: currentlyPlayingAppId guarded by isStale at derivation time — both badge JSX and derivation for defense in depth
- [Phase 05-01]: game-card CSS class (not inline style) for responsive width — inline style cannot be overridden by @media queries
- [Phase 05-02]: All 7 Phase 5 visual checks passed on first human review — no remediation required; project v1 complete

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 3 prereq]: Steam profile privacy for Steam ID 76561198275331284 must be confirmed as "Public > Game details" before Steam fetch script can be tested. This is a user-account setting, not a code problem.
- [Phase 4 prereq]: Spotify refresh token initial setup requires a one-time manual OAuth flow to generate the refresh token — RUNBOOK-spotify-token.md created in Phase 4 Plan 1.

## Session Continuity

Last session: 2026-03-18
Stopped at: Completed 05-02-PLAN.md — human visual verification passed; Phase 5 and project v1 complete
Resume file: None — all phases complete
