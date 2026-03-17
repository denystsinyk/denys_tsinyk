---
phase: 01-foundation
plan: 02
subsystem: infra
tags: [github-actions, github-pages, vite, deploy, ci-cd]

# Dependency graph
requires:
  - phase: 01-foundation
    plan: 01
    provides: Vite project scaffold with VITE_BASE_PATH env var support in vite.config.ts
provides:
  - .github/workflows/deploy.yml — GitHub Actions pipeline: checkout, build with VITE_BASE_PATH, upload artifact, deploy to GitHub Pages
  - Live GitHub Pages URL at https://<username>.github.io/denys_tsinyk/
affects: [02-data-pipeline, 03-steam, 04-spotify, 05-polish]

# Tech tracking
tech-stack:
  added:
    - "actions/checkout@v4"
    - "actions/setup-node@v4"
    - "actions/configure-pages@v5"
    - "actions/upload-pages-artifact@v3"
    - "actions/deploy-pages@v4"
  patterns:
    - "Official GitHub Actions deploy-pages pipeline (not peaceiris)"
    - "actions/configure-pages outputs base_path injected as VITE_BASE_PATH env var to build step"
    - "pages + id-token write permissions required for deploy-pages pipeline"
    - "concurrency group: pages with cancel-in-progress for race-free deploys"

key-files:
  created:
    - .github/workflows/deploy.yml
  modified: []

key-decisions:
  - "Used official actions/deploy-pages@v4 pipeline — not peaceiris/actions-gh-pages — for long-term GitHub support"
  - "actions/configure-pages@v5 id=pages so steps.pages.outputs.base_path resolves to /denys_tsinyk/ in CI"
  - "VITE_BASE_PATH injected at build step env, consumed by vite.config.ts base field"
  - "One-time manual setup required: GitHub repo Settings > Pages > Source must be set to GitHub Actions"

patterns-established:
  - "Pattern: GitHub Pages deploy via official actions pipeline with dynamic base_path injection"
  - "Pattern: VITE_BASE_PATH env var bridges CI page configuration to Vite build base"

requirements-completed: [FNDN-02]

# Metrics
duration: 3min
completed: 2026-03-17
---

# Phase 1 Plan 02: GitHub Pages Deploy Workflow Summary

**GitHub Actions CI/CD pipeline deploying Vite site to GitHub Pages with dynamic base_path injection via actions/configure-pages@v5**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-17T03:26:20Z
- **Completed:** 2026-03-17T03:29:00Z
- **Tasks:** 1 of 2 automated (Task 2 is human-verify checkpoint)
- **Files modified:** 1

## Accomplishments

- GitHub Actions deploy workflow created and pushed to main — pipeline triggered automatically
- Official `actions/deploy-pages@v4` pipeline used (not peaceiris) for long-term GitHub support
- Dynamic base path injection: `actions/configure-pages@v5` outputs `base_path=/denys_tsinyk/` injected as `VITE_BASE_PATH` env var so Vite builds assets with correct sub-path prefix

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GitHub Actions deploy workflow** - `70dc292` (feat)

## Files Created/Modified

- `.github/workflows/deploy.yml` — Full CI/CD pipeline: checkout, Node 20 + npm cache, npm ci, configure-pages, build with VITE_BASE_PATH, upload-pages-artifact, deploy-pages

## Decisions Made

- Used official `actions/deploy-pages@v4` pipeline — GitHub's recommended approach; `peaceiris/actions-gh-pages` is a community action and not required when using GitHub-native Pages environments
- `actions/configure-pages@v5` must have `id: pages` so the expression `${{ steps.pages.outputs.base_path }}` resolves correctly; without the id, the step output reference fails silently
- `permissions: pages: write` and `permissions: id-token: write` are mandatory — omitting either causes "Resource not accessible by integration" failure in the deploy step
- One-time manual setup required: the GitHub repository Settings > Pages > Build and deployment > Source must be changed from "Deploy from a branch" to "GitHub Actions" before the first deploy will succeed

## Deployment Configuration

**Live GitHub Pages URL:** `https://denystsinyk.github.io/denys_tsinyk/`

**One-time GitHub repo setup (required before first deploy):**
1. Go to GitHub repository Settings > Pages
2. Under "Build and deployment" > Source: select "GitHub Actions"
3. Save — this unlocks the `github-pages` environment for the workflow

**Base path resolution:**
- `actions/configure-pages@v5` detects the repo name and emits `base_path = /denys_tsinyk/`
- The Build step receives `VITE_BASE_PATH=/denys_tsinyk/`
- `vite.config.ts` uses `base: process.env.VITE_BASE_PATH ?? '/'` — so CI gets `/denys_tsinyk/`, local dev gets `/`
- All JS/CSS/image asset URLs in the built `dist/` are prefixed correctly, preventing 404s

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — the workflow file was straightforward to create. The one-time GitHub Pages source configuration (Settings > Pages > Source = GitHub Actions) is documented in the plan and expected as a prerequisite before the first deploy can succeed.

## User Setup Required

**One-time GitHub repository settings change (required before deploy succeeds):**
1. Open the GitHub repository in a browser
2. Navigate to Settings > Pages
3. Under "Build and deployment" > Source: change from "Deploy from a branch" to "GitHub Actions"
4. Click Save

Without this change, the `deploy-pages` job will fail silently or show a 404 at the Pages URL.

**Verify deployment:**
- GitHub repository > Actions tab > "Deploy to GitHub Pages" workflow > should show green checkmark
- URL from deploy job output: `https://denystsinyk.github.io/denys_tsinyk/`
- Confirm: "Denys Tsinyk" heading, dark background, work entries (NFL/Pitt/PittCSC), footer icons all visible
- DevTools Network tab: no 404 errors on JS/CSS/image assets

## Next Phase Readiness

- Deploy pipeline in place — every push to main auto-deploys
- Phase 2 (data pipeline) can begin once live URL is confirmed working
- Placeholder social links (GITHUB_USERNAME, LINKEDIN_SLUG, EMAIL_ADDRESS) in `src/data/social.ts` still need replacing with real values before the site is fully live

## Self-Check: PASSED

- FOUND: `.github/workflows/deploy.yml`
- FOUND: `.planning/phases/01-foundation/01-02-SUMMARY.md`
- FOUND: commit `70dc292` (feat(01-02): add GitHub Actions deploy workflow)

---
*Phase: 01-foundation*
*Completed: 2026-03-17*
