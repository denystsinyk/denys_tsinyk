# Roadmap: Denys Tsinyk Personal Website

## Overview

Five phases deliver a live-data personal portfolio from zero to production. Phase 1 ships a real URL with static content before any API work begins. Phase 2 defines the data contract and validates the end-to-end data flow with the lowest-friction API (GitHub, no secret setup). Phases 3 and 4 add the live-data differentiators — Steam and Spotify — in order of OAuth complexity. Phase 5 hardens the cross-cutting polish: staleness indicators, hover states, and responsive refinements that are cleanest to add once all sections exist.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Deploy a real URL with static portfolio content before any API work begins (completed 2026-03-17)
- [x] **Phase 2: Data Contract + GitHub Stats** - Define the data.json schema and validate the full data pipeline with GitHub's public API (completed 2026-03-17)
- [ ] **Phase 3: Steam Pipeline** - Wire up the Actions cron, Steam API, and render the gaming section with live "PLAYING NOW" detection
- [ ] **Phase 4: Spotify Integration** - Add the Spotify fetch module with OAuth refresh-token handling and render the music section
- [ ] **Phase 5: Polish + Hardening** - Add hover states, staleness suppression, responsive refinements, and visual consistency pass

## Phase Details

### Phase 1: Foundation
**Goal**: A deployed, shareable portfolio URL exists with static content — name, work experience, social links, and the dark minimal aesthetic — with zero pipeline dependency
**Depends on**: Nothing (first phase)
**Requirements**: FNDN-01, FNDN-02, PROF-01, PROF-02, PROF-03, PROF-04, SOCL-01
**Success Criteria** (what must be TRUE):
  1. Visiting the GitHub Pages URL renders the site with "Denys Tsinyk" as the prominent page header alongside a headshot photo
  2. User sees all 3 work experience one-liners (NFL, Pitt TA, PittCSC) with no dates, separated by subtle gray dividers
  3. User sees a footer with working icon links for GitHub, LinkedIn, Email, and Steam
  4. The site renders the correct dark background (#0a0a0a) and green (#00ff00) accent with monospace font for data values
  5. Pushing a code change to main automatically triggers a deploy and the live URL reflects the change
**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Vite+React+TS+Tailwind v4 and author static content components (HeroSection, WorkSection, Footer)
- [x] 01-02-PLAN.md — Create GitHub Actions deploy workflow and verify live GitHub Pages deployment

### Phase 2: Data Contract + GitHub Stats
**Goal**: The data.json schema is locked as the architectural contract, and the GitHub Stats section — pinned repos, top languages, contribution streak — renders from live GitHub API data committed by the pipeline
**Depends on**: Phase 1
**Requirements**: FNDN-03, FNDN-04, PIPE-01, PIPE-02, PIPE-03, PROJ-01, PROJ-02, PROJ-03
**Success Criteria** (what must be TRUE):
  1. TypeScript types in src/types/data.ts fully define the data.json shape, and the site fails to compile if a component reads a field not in the schema
  2. User sees pinned GitHub repos with repo name, description, star count, and primary language badge; each card opens the repo in a new tab
  3. User sees a GitHub stats bar showing top languages and contribution streak populated from live data
  4. The site footer shows an updated_at timestamp that changes on every cron run, confirming data freshness
  5. If steam_ok or spotify_ok is false in data.json, the corresponding section shows a fallback state instead of blank or stale content
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — TypeScript data contract (src/types/data.ts), useData() hook, and stub public/data.json
- [x] 02-02-PLAN.md — GitHub Actions cron pipeline (refresh-data.yml) and fetch-github-data.js script
- [x] 02-03-PLAN.md — ProjectsSection, GitHubStatsSection, Footer update, App.tsx wiring, and steam/spotify fallback placeholders

### Phase 3: Steam Pipeline
**Goal**: The GitHub Actions cron workflow is running in production, Steam data is fetched every ~10 minutes, and the gaming section shows top 5 played games with capsule art and accurate "PLAYING NOW" detection
**Depends on**: Phase 2
**Requirements**: GAME-01, GAME-02, GAME-03
**Success Criteria** (what must be TRUE):
  1. User sees the top 5 most played Steam games sorted by hours descending, each showing the wide capsule art and hours in "1,234 hours played" monospace format
  2. If the currently playing game is in the top 5, that card shows a green pulse glow and "PLAYING NOW" badge
  3. If the currently playing game is not in the top 5, it appears above the top 5 list with the same "PLAYING NOW" treatment
  4. The refresh-data.yml workflow runs on schedule, commits updated public/data.json with [skip ci], and does not trigger an infinite deploy loop
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Steam fetch script (fetch-steam-data.js) and refresh-data.yml workflow update
- [ ] 03-02-PLAN.md — GamingSection component with GameCard, pulse-dot animation, and steam_ok fallback
- [ ] 03-03-PLAN.md — App.tsx wiring and human visual verification

### Phase 4: Spotify Integration
**Goal**: The Spotify fetch module handles the OAuth refresh-token exchange reliably, and the music section renders the last 5 listened tracks as a horizontal scrollable row with album art
**Depends on**: Phase 3
**Requirements**: MUSC-01, MUSC-02, MUSC-03
**Success Criteria** (what must be TRUE):
  1. User sees the last 5 Spotify tracks in a horizontal scrollable row with square album art, track name, and artist name beneath each
  2. Each track is clickable and opens the Spotify track URL in a new tab
  3. If Spotify data is unavailable (spotify_ok: false or empty array), the music section shows a graceful fallback message instead of a blank section
  4. The pipeline fails loudly (exit 1) on Spotify token exchange failure and writes spotify_ok: false, so stale music data is never silently served
**Plans**: 3 plans

Plans:
- [ ] 04-01-PLAN.md — Spotify pipeline script (fetch-spotify-data.js), refresh-data.yml step, OAuth runbook
- [ ] 04-02-PLAN.md — MusicSection component, .hide-scrollbar CSS, App.tsx wiring (replace placeholder)
- [ ] 04-03-PLAN.md — Human checkpoint: OAuth secrets setup + visual verification

### Phase 5: Polish + Hardening
**Goal**: All interactive and visual refinements are applied consistently across sections — hover states on game covers, staleness suppression of live indicators, and responsive layout pass — completing the portfolio's brutalist aesthetic
**Depends on**: Phase 4
**Requirements**: GAME-04
**Success Criteria** (what must be TRUE):
  1. Hovering over a game cover produces a smooth scale-up and green glow effect
  2. If data.json updated_at is more than 30 minutes old, the "PLAYING NOW" badge and pulse animation are suppressed so stale live-state indicators are never shown
  3. All sections render correctly on mobile viewport widths without horizontal overflow or broken layouts
  4. Typography is consistent: monospace font on all numeric data values (hours, stats), clean sans-serif on all prose and labels
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-17 |
| 2. Data Contract + GitHub Stats | 3/3 | Complete   | 2026-03-17 |
| 3. Steam Pipeline | 2/3 | In Progress|  |
| 4. Spotify Integration | 0/TBD | Not started | - |
| 5. Polish + Hardening | 0/TBD | Not started | - |
