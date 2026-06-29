---
phase: 03-steam-pipeline
plan: 01
subsystem: infra
tags: [steam, github-actions, node, fetch, cron, data-pipeline]

requires:
  - phase: 02-data-contract-github-stats
    provides: "public/data.json structure and refresh-data.yml cron workflow skeleton"

provides:
  - "scripts/fetch-steam-data.js — Steam API fetch script (top 5 games + currently-playing detection)"
  - "Updated .github/workflows/refresh-data.yml with Steam fetch step after GitHub step"

affects:
  - 03-02 (GamingSection component consumes steam fields from data.json)
  - 03-03 (end-to-end live data verification)

tech-stack:
  added: []
  patterns:
    - "Read-patch-write pattern: Steam script reads existing data.json, patches steam/steam_ok fields, writes back — never overwrites full file"
    - "Sequential pipeline steps: refresh-data.yml runs GitHub fetch then Steam fetch then single commit [skip ci]"

key-files:
  created:
    - scripts/fetch-steam-data.js
  modified:
    - .github/workflows/refresh-data.yml

key-decisions:
  - "Steam script reads and patches data.json (not a full overwrite) — preserves GitHub data written by prior step"
  - "On Steam fetch failure: steam_ok=false, existing steam data preserved — last good state survives transient errors"
  - "gameid from GetPlayerSummaries is a string; parseInt(player.gameid, 10) used for appid comparison to avoid type mismatch"
  - "STEAM_API_KEY and STEAM_ID named as GitHub secrets — matches plan prereq naming convention"

patterns-established:
  - "Pattern: Parallel pipeline script — each data source has its own fetch script, called sequentially from refresh-data.yml"
  - "Pattern: Env var validation at script top — exit(1) with clear error if required vars missing"

requirements-completed:
  - GAME-01

duration: 2min
completed: 2026-03-18
---

# Phase 3 Plan 01: Steam Pipeline - Fetch Script Summary

**Steam data fetch script using GetOwnedGames + GetPlayerSummaries with read-patch-write data.json strategy, wired into GitHub Actions cron workflow**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-18T00:10:59Z
- **Completed:** 2026-03-18T00:12:17Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `scripts/fetch-steam-data.js` following exact `fetch-github-data.js` structure (ESM, same imports, same output path pattern)
- Implemented two-call Steam API strategy: GetOwnedGames for top 5 sorted by playtime_forever, GetPlayerSummaries for live currently-playing detection
- Correctly handles gameid string-to-int coercion to avoid type mismatch in currently-playing matching
- On fetch failure: steam_ok=false with existing steam data preserved (no data loss on transient errors)
- Added "Fetch Steam data" step to refresh-data.yml between GitHub fetch and commit steps, with STEAM_API_KEY and STEAM_ID secrets

## Task Commits

Each task was committed atomically:

1. **Task 1: Create scripts/fetch-steam-data.js** - `24698c8` (feat)
2. **Task 2: Update refresh-data.yml with Steam fetch step** - `cdc4a66` (feat)

## Files Created/Modified

- `scripts/fetch-steam-data.js` - Steam API fetch script: reads data.json, fetches top 5 games and currently-playing, patches steam/steam_ok fields, writes back
- `.github/workflows/refresh-data.yml` - Added Fetch Steam data step between GitHub fetch and commit steps

## Decisions Made

- Used read-patch-write approach (not full overwrite) — Steam script runs after GitHub script; must preserve GitHub data
- Preserved existing steam data on catch — transient Steam API failures don't wipe last good game state
- `parseInt(player.gameid, 10)` for appid matching — gameid from GetPlayerSummaries is a string, appid in owned games is a number

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration before the Steam workflow step will succeed:**

1. **Steam API Key** — Register at https://steamcommunity.com/dev/apikey (any domain, e.g. localhost)
   - Add as GitHub secret: `STEAM_API_KEY`
   - Location: GitHub repo > Settings > Secrets and variables > Actions > New repository secret

2. **Steam ID** — Already confirmed: `76561198275331284`
   - Add as GitHub secret: `STEAM_ID`
   - Same location as above

3. **Steam profile privacy** — Steam profile for ID 76561198275331284 must have:
   - "My Profile" = Public
   - "Game details" = Public
   - Location: Steam > Profile > Edit Profile > Privacy Settings

Without these, the Steam step will exit with `steam_ok: false` (which is graceful — no crash, data preserved).

## Next Phase Readiness

- `scripts/fetch-steam-data.js` is complete and ready to populate `data.json.steam` when secrets are added
- `refresh-data.yml` wired correctly: GitHub → Steam → commit
- Plan 02 (GamingSection component) can proceed independently — component reads from data.json, which already has `steam_ok: false` stub data for local dev

---
*Phase: 03-steam-pipeline*
*Completed: 2026-03-18*
