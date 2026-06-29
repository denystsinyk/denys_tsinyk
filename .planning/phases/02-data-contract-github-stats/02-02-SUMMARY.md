---
phase: 02-data-contract-github-stats
plan: 02
subsystem: infra
tags: [github-actions, graphql, node, cron, pipeline, data-json]

# Dependency graph
requires:
  - phase: 02-data-contract-github-stats/02-01
    provides: public/data.json SiteData schema and TypeScript types that the pipeline writes to

provides:
  - scripts/fetch-github-data.js — Node.js ESM pipeline script calling GitHub GraphQL
  - .github/workflows/refresh-data.yml — cron workflow refreshing public/data.json every 10 min

affects: [03-steam-section, 04-spotify-section, 05-polish-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Native fetch in Node 18+ (no npm packages) for GitHub GraphQL call"
    - "git diff --cached --quiet guard prevents empty commits in pipelines"
    - "[skip ci] in commit message prevents deploy.yml re-trigger on data refresh commits"
    - "github.repository_owner Actions context for username — never hardcoded"
    - "computeStreak() derived from contributionCalendar.weeks — no GitHub streak field exists"
    - "Top languages counted from pinnedItems primaryLanguage.color — no static color map"

key-files:
  created:
    - scripts/fetch-github-data.js
    - .github/workflows/refresh-data.yml
  modified: []

key-decisions:
  - "GH_PAT (classic PAT) used instead of GITHUB_TOKEN — GITHUB_TOKEN may lack read:user scope for pinnedItems GraphQL query"
  - "Top languages derived from pinned repos' primaryLanguage (same single GraphQL call) — more accurate all-repos approach deferred to Phase 5"
  - "Year-boundary streak limitation accepted for v1 — contributionsCollection defaults to current year"
  - "No workflow_dispatch trigger — PIPE-04 is v2 scope per REQUIREMENTS.md"

patterns-established:
  - "Pipeline pattern: fetch data → write JSON → git diff guard → commit [skip ci] → push"
  - "ESM Node script with native fetch — no npm install step in pipeline"

requirements-completed: [PIPE-01, PIPE-02]

# Metrics
duration: 2min
completed: 2026-03-17
---

# Phase 2 Plan 2: GitHub Data Pipeline Summary

**GitHub GraphQL cron pipeline via native-fetch Node.js script and GitHub Actions refresh-data.yml writing public/data.json every 10 minutes**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-17T15:32:43Z
- **Completed:** 2026-03-17T15:34:56Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `scripts/fetch-github-data.js` calls GitHub GraphQL in one request for pinned repos + contribution calendar, computes streak and top languages, writes `public/data.json` — exits 1 on any error without overwriting last-good data
- `.github/workflows/refresh-data.yml` runs on `*/10 * * * *` cron with `permissions: contents: write`, reads `GH_PAT` secret, and uses `git diff --cached --quiet` guard to skip empty commits
- All requirements for PIPE-01 and PIPE-02 met: cron trigger, `updated_at` ISO timestamp, `[skip ci]` anti-rebuild pattern, and no npm packages added

## Task Commits

Each task was committed atomically:

1. **Task 1: Create fetch-github-data.js pipeline script** - `ed096a4` (feat)
2. **Task 2: Create refresh-data.yml cron workflow** - `26cade7` (feat)

## Files Created/Modified

- `scripts/fetch-github-data.js` — ESM Node.js script: reads GH_TOKEN/GH_LOGIN env, GraphQL query for pinnedItems + contributionCalendar, computeStreak(), computeTopLanguages(), writes public/data.json
- `.github/workflows/refresh-data.yml` — Cron workflow: */10 schedule, contents: write permission, GH_PAT secret, no-npm-install, safe git commit-back

## Decisions Made

- Used `GH_PAT` (classic PAT) instead of auto `GITHUB_TOKEN` — `GITHUB_TOKEN` may lack `read:user` scope for user-level GraphQL `pinnedItems` queries (RESEARCH.md Pitfall 1)
- Derived top languages from pinned repos' `primaryLanguage` field in the same GraphQL call — avoids a second REST call; all-repos accuracy is a Phase 5 enhancement
- Accepted year-boundary streak limitation for v1 — `contributionsCollection` defaults to current year; documented as known gap
- Did not add `workflow_dispatch` trigger — deferred to PIPE-04 (v2 scope per REQUIREMENTS.md)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before the pipeline can run:**

- **GH_PAT secret:** GitHub repo Settings > Secrets and variables > Actions > New repository secret > Name: `GH_PAT` > Value: a classic PAT with `read:user` and `public_repo` scopes (GitHub Settings > Developer settings > Personal access tokens (classic))
- Without this secret, the workflow will fail with a 401/403 on the GraphQL call

## Next Phase Readiness

- Pipeline infrastructure complete — `public/data.json` will be refreshed with live GitHub data every 10 minutes once `GH_PAT` secret is configured
- Phase 3 (Steam section) can proceed: `steam_ok: false` stub is in the payload, pipeline is in place to add Steam fetch logic
- Phase 4 (Spotify section): same — `spotify_ok: false` stub ready for Phase 4 fetch logic addition

---
*Phase: 02-data-contract-github-stats*
*Completed: 2026-03-17*
