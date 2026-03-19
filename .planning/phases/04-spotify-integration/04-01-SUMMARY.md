---
phase: 04-spotify-integration
plan: 01
subsystem: infra
tags: [spotify, oauth, node, github-actions, pipeline, refresh-token]

# Dependency graph
requires:
  - phase: 03-steam-pipeline
    provides: "read-patch-write pattern for data.json — fetch-steam-data.js as structural template"
  - phase: 02-data-contract-github-stats
    provides: "SpotifyTrack and SpotifyData types in src/types/data.ts, public/data.json shape"
provides:
  - "scripts/fetch-spotify-data.js — OAuth token exchange + recently-played fetch + data.json patch"
  - "refresh-data.yml updated with Spotify step (GitHub -> Steam -> Spotify -> Commit order)"
  - "RUNBOOK-spotify-token.md — one-time OAuth setup guide for generating SPOTIFY_REFRESH_TOKEN"
affects: [04-spotify-ui, 05-polish-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Spotify Authorization Code Flow token refresh (Basic auth POST to accounts.spotify.com/api/token)"
    - "Refresh token rotation detection via console.warn (no auto-update — manual secret update required)"

key-files:
  created:
    - scripts/fetch-spotify-data.js
    - .planning/phases/04-spotify-integration/RUNBOOK-spotify-token.md
  modified:
    - .github/workflows/refresh-data.yml

key-decisions:
  - "currently_playing: null always — Phase 4 spec defers currently-playing music indicator to v2"
  - "images[0] (largest 640x640) not images[2] for album art — Spotify images array sorted by size descending"
  - "Refresh token rotation handled as console.warn only — GitHub Secrets cannot be auto-updated from pipeline"
  - "No new npm dependencies — native fetch and Buffer.from (Node 18+) cover all HTTP and auth needs"

patterns-established:
  - "Spotify token exchange: Basic auth with base64-encoded client_id:client_secret, URLSearchParams body"
  - "read-patch-write for data.json: readFileSync before try, writeFileSync after try/catch — same as steam script"

requirements-completed: [MUSC-01, MUSC-02, MUSC-03]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 4 Plan 1: Spotify Integration Pipeline Summary

**Node.js ESM pipeline that exchanges a Spotify refresh token for access token, fetches last 5 recently-played tracks, and patches data.json — wired into GitHub Actions cron between Steam and Commit steps**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-19T00:17:24Z
- **Completed:** 2026-03-19T00:19:09Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Spotify data-fetching script (`scripts/fetch-spotify-data.js`) with OAuth token refresh, recently-played API call, and read-patch-write data.json update
- `refresh-data.yml` updated with Spotify fetch step inserted in correct position: checkout → setup-node → GitHub → Steam → Spotify → Commit
- `RUNBOOK-spotify-token.md` with complete 5-step one-time OAuth Authorization Code Flow guide including curl command and GitHub Secrets setup instructions

## Task Commits

Each task was committed atomically:

1. **Task 1: Write scripts/fetch-spotify-data.js** - `0263085` (feat)
2. **Task 2: Update refresh-data.yml + create OAuth runbook** - `d0be5d6` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `scripts/fetch-spotify-data.js` - Spotify OAuth token exchange, recently-played fetch, read-patch-write data.json patch; env var validation with exit(1) on missing secrets
- `.github/workflows/refresh-data.yml` - Added Fetch Spotify data step with all three secret env vars between Steam and Commit steps
- `.planning/phases/04-spotify-integration/RUNBOOK-spotify-token.md` - One-time OAuth setup: create Spotify app, build authorization URL, exchange code for refresh token via curl, add three GitHub Secrets

## Decisions Made

- `currently_playing: null` always — Phase 4 spec explicitly defers the currently-playing music indicator to v2
- `images[0]` for album art — first image in Spotify's array is the largest (640x640), not images[2]
- Refresh token rotation: detect and warn via `console.warn` only; GitHub Actions has no API for auto-updating Secrets, so manual update is required
- No new npm dependencies — Node 18+ native `fetch` and `Buffer.from` handle all HTTP requests and Basic auth encoding

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Before the Spotify step in the pipeline can succeed, three GitHub Secrets must be added:

| Secret name              | Source                                                            |
|--------------------------|-------------------------------------------------------------------|
| `SPOTIFY_CLIENT_ID`      | Spotify Developer Dashboard → Your App → Settings → Client ID    |
| `SPOTIFY_CLIENT_SECRET`  | Spotify Developer Dashboard → Your App → Settings → Client Secret |
| `SPOTIFY_REFRESH_TOKEN`  | Generated via the one-time OAuth flow in RUNBOOK-spotify-token.md |

See `.planning/phases/04-spotify-integration/RUNBOOK-spotify-token.md` for the complete setup guide.

## Next Phase Readiness

- Pipeline infrastructure is complete: Spotify data will be fetched and written to `data.json` on every cron run once secrets are configured
- Phase 4 Plan 2 (MusicSection UI component) can begin — the `spotify` and `spotify_ok` fields in `data.json` are ready for the UI to consume
- Blocker: Spotify secrets must be configured in GitHub repo Settings before end-to-end pipeline testing is possible

---
*Phase: 04-spotify-integration*
*Completed: 2026-03-19*
