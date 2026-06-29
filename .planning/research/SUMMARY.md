# Project Research Summary

**Project:** Denys Tsinyk — Personal Portfolio Website
**Domain:** Static developer portfolio with live API data pipeline (Steam, Spotify, GitHub)
**Researched:** 2026-03-16
**Confidence:** MEDIUM-HIGH (stack and architecture highly confident; feature priorities and pitfall specifics based on training data, no live web verification)

## Executive Summary

This is a dark-aesthetic, data-forward personal portfolio deployed as a static site on GitHub Pages. The defining architectural decision is a two-context system: a GitHub Actions cron workflow (server context) periodically fetches live data from Steam, Spotify, and GitHub APIs and commits the result as `public/data.json`; a React SPA (browser context) fetches that file once on load and renders all sections from it. This design keeps API secrets entirely server-side, eliminates client-side API calls, and produces a near-instant page load because the only runtime fetch is a small JSON file. The recommended stack is React 18 + Vite 6 + TypeScript 5 + Tailwind CSS v4, all at stable, current releases with no exotic dependencies.

The recommended build order is static-skeleton first (no pipeline risk), then GitHub stats (public API, no secrets, validates the GitHub integration pattern), then the Actions data pipeline with Steam (simpler OAuth), and finally Spotify (most complex due to the OAuth refresh token loop). This order ensures a shippable, professional portfolio exists at every stage and de-risks the most complex integration last. The live-data features — Steam "PLAYING NOW" badge, top 5 games, last 5 Spotify tracks — are genuine differentiators in this niche and should not be deferred; they are the entire point of the design.

The dominant risk category is silent pipeline failure: Spotify refresh tokens can be invalidated, GitHub cron workflows are suspended after 60 days of repo inactivity, and stale `data.json` will show misleading live-state indicators indefinitely. All three risks have clear mitigations (loud error handling, `workflow_dispatch` fallback triggers, freshness checks in the UI), but they must be addressed during the pipeline phase, not as polish. The Vite `base` path misconfiguration is the most common first-deploy failure and must be handled before any deployment testing.

---

## Key Findings

### Recommended Stack

The stack is well-established and all components are at stable current releases with zero exotic choices. React 18.3 over React 19 is the right call for this scope — no migration risk, full ecosystem support. Vite 6 replaces the dead Create React App and is the standard for new React projects. Tailwind CSS v4 (released February 2025) integrates directly as a Vite plugin, eliminating the PostCSS config requirement. React Query v5 handles the single `fetch('/data.json')` call and provides loading/error states without manual `useEffect` + `useState` boilerplate. The data pipeline in GitHub Actions uses only native Node 20 `fetch` (no `axios`) and `@octokit/graphql` for the one API that requires it (pinned repos, GraphQL-only).

**Core technologies:**
- React 18.3 + TypeScript 5 (strict mode): UI and type safety for the data.json contract
- Vite 6: build tool, sub-second HMR, trivial GitHub Pages `base` config via env var
- Tailwind CSS v4 (Vite plugin): utility-first styling for dark/minimal aesthetic, no PostCSS config
- CSS custom properties: design tokens at `:root` (`--color-bg: #0a0a0a`, `--color-accent: #00ff00`) — single source of truth
- React Query v5: single `useQuery` wrapping `fetch('/data.json')` — eliminates manual async state
- Node 20 native `fetch` + `@octokit/graphql`: server-side API calls in GitHub Actions, no extra HTTP libraries
- `actions/deploy-pages` v4 + `actions/configure-pages` v5: official GitHub Pages deployment, no third-party trust required

### Expected Features

The core value proposition is live-data sections. Table stakes are standard portfolio elements. Anti-features are well-defined and should be enforced — in particular, no dark/light toggle (undermines the aesthetic identity), no skills progress bars (amateur signal), no contact form (email link is sufficient), and no typewriter animation on bio text.

**Must have (table stakes):**
- Name + one-liner bio — first thing every visitor reads
- Work experience (3 one-liner entries, no dates) — professional context
- Projects section (pinned GitHub repos, stars, language badge) — core proof of work
- Social/contact links (GitHub, LinkedIn, Email, Steam) — path to reach out
- Dark background (`#0a0a0a`) — the aesthetic IS the brand for this site
- Responsive layout — mobile traffic ~50%+ even for dev portfolios
- Favicon + page title — missing = unfinished
- Readable contrast (WCAG AA minimum) — dark sites frequently fail this

**Should have (differentiators):**
- Steam "PLAYING NOW" badge with green pulse glow — real-time state, high personality signal
- Top 5 Steam games by hours with capsule art — concrete, verifiable identity data
- Spotify last 5 tracks with album art (horizontal scroll) — music taste as personality
- GitHub contribution streak + top languages bar — demonstrates consistent activity, reveals real skill composition
- `data.json` cron pipeline — technically clean, sophisticated visitors notice and respect this

**Defer permanently:**
- Contact form — `mailto:` link is sufficient, form adds server-side complexity
- Blog/writing section — empty blog is worse than no blog, creates maintenance debt
- Dark/light mode toggle — undermines intentional design
- Skills progress bars — no data supports percentages, looks amateur
- Heavy page-load animations — dated, slows perceived load

### Architecture Approach

The system has two completely separate runtime contexts sharing data through a single file. The GitHub Actions context holds all secrets and API calls; the React browser context is entirely public and reads only the committed `data.json`. The `data.json` schema is the contract between these two contexts and must be defined before building either the pipeline or the UI components — it is the foundational architectural artifact. Every section component reads from its own slice of this schema and must degrade gracefully if its slice is null or empty (pipeline failures are expected, not exceptional).

**Major components:**
1. `scripts/fetch.js` (+ `steam.js`, `spotify.js`, `github.js`) — GitHub Actions server context; orchestrates all API calls, normalizes responses, writes `public/data.json`
2. `.github/workflows/refresh-data.yml` — cron trigger (every 10 min), runs fetch script, conditional commit with `[skip ci]`
3. `.github/workflows/deploy.yml` — push-triggered Vite build + GitHub Pages deployment, only fires on real code changes
4. `src/types/data.ts` — TypeScript interfaces for `data.json` shape, the shared contract
5. `hooks/useData.ts` — single React Query fetch of `/data.json`, distributes data to all sections via props
6. Section components (HeroSection, WorkSection, ProjectsSection, GithubStatsSection, GamingSection, MusicSection, Footer) — each reads its own data slice, renders gracefully when empty
7. `src/data/work.ts` — static work experience hardcoded in source (not in pipeline); static data stays out of `data.json`

### Critical Pitfalls

1. **Spotify refresh token silently invalidated** — Fail loudly on token exchange failure (`exit 1`, not silent skip); write `spotify_ok: false` to `data.json` so the UI renders a fallback instead of stale data; add failure notifications; document token rotation procedure.

2. **Stale `data.json` showing misleading live-state indicators** — Always write `updated_at` ISO timestamp to `data.json` root; in the UI, compute data age and suppress "PLAYING NOW" badge and pulse animation if `updated_at` is more than 30 minutes old (3× the cron interval).

3. **GitHub Actions cron suspended after 60 days of repo inactivity** — Add `workflow_dispatch` trigger alongside `schedule`; the auto-commit of `data.json` on each run naturally resets the 60-day clock, but only while the workflow is still running. Once suspended, manual re-enable is required.

4. **Infinite workflow loop from auto-commit triggering push event** — Use default `GITHUB_TOKEN` for the commit step (commits with `GITHUB_TOKEN` do not trigger `on: push` workflows); add `[skip ci]` to the commit message as secondary safeguard; do NOT add `on: push` to the data-refresh workflow.

5. **Vite `base` path misconfigured for GitHub Pages subdirectory** — Set `base: process.env.VITE_BASE_PATH ?? '/'` in `vite.config.ts`; use `actions/configure-pages` to inject the correct value automatically in CI. This is the most common first-deploy failure — test with `vite preview` locally before first push.

---

## Implications for Roadmap

Based on combined research, the natural phase structure follows the dependency chain: the `data.json` schema is a prerequisite for everything, the pipeline must exist before live sections can be built, and the Spotify integration (most complex) should come after Steam (simpler) is validated.

### Phase 1: Foundation — Project Scaffold and Static Portfolio

**Rationale:** A shippable, professional portfolio should exist before any pipeline work begins. This phase has zero pipeline risk and validates the Vite + Tailwind + GitHub Pages deployment path. Fixing the `base` path configuration here prevents the most common deployment failure from surfacing later.
**Delivers:** Deployed static site with hero, work experience, contact links, and basic layout. A real URL that can be shared.
**Addresses:** All table-stakes features that require no API (name/bio, work experience, social links, dark aesthetic, typography, responsive layout, favicon).
**Avoids:** Vite `base` misconfiguration (Pitfall 5), GitHub Pages routing issues (Pitfall 4), missing `gh-pages` branch setup (Pitfall 11).
**Research flag:** Standard patterns — no additional research needed. Vite + Tailwind + GitHub Pages deployment is thoroughly documented.

### Phase 2: Data Contract and GitHub Stats

**Rationale:** Define the `data.json` schema before building any pipeline or live-data UI. GitHub stats use the public GraphQL API (no secret setup), making this the lowest-friction API integration — it validates the data flow architecture before touching Spotify or Steam secrets.
**Delivers:** `src/types/data.ts` schema definition, `scripts/github.js` fetch module, GitHub Stats section (pinned repos, top languages bar, contribution streak) populated from live data.
**Addresses:** Projects section (pinned repos), GitHub stats section (differentiator features).
**Uses:** `@octokit/graphql` v8, GitHub Actions `GITHUB_TOKEN` (auto-provided, no manual secret setup).
**Avoids:** Pinned repos not available via REST (Pitfall 9) — use GraphQL from the start; stale data without freshness metadata — define `updated_at` in the schema now.
**Research flag:** Standard patterns — GraphQL pinned repos query is well-documented.

### Phase 3: GitHub Actions Data Pipeline Core

**Rationale:** Once the schema and one integration are proven, build the full cron pipeline infrastructure. Wire up the Actions workflows, the conditional commit logic, and the Steam integration (simpler than Spotify — no OAuth refresh loop). This phase must address the infinite loop and stale-data pitfalls before they can cause problems.
**Delivers:** `refresh-data.yml` cron workflow, `deploy.yml` build+deploy workflow, `scripts/steam.js` fetch module, Steam section (top 5 games, capsule art, "PLAYING NOW" badge based on `GetPlayerSummaries`).
**Addresses:** Steam differentiator features (currently playing, top games with hours).
**Avoids:** Infinite workflow loop (Pitfall 7) — `GITHUB_TOKEN` commit + `[skip ci]`; cron suspension (Pitfall 3) — `workflow_dispatch` trigger; Steam privacy blocking data (Pitfall 2) — `steam_ok` flag + clear log message; wrong Steam endpoint for "now playing" (Pitfall 8) — `GetPlayerSummaries.gameextrainfo`, not `GetRecentlyPlayedGames`.
**Research flag:** Needs validation — Steam profile privacy setting for `76561198275331284` must be verified as "Public > Game details" before this phase can be tested.

### Phase 4: Spotify Integration

**Rationale:** Spotify is the most complex integration due to the OAuth refresh token setup and the risk of silent token invalidation. It comes after Steam is working so the pipeline pattern is already proven. Token rotation failure handling must be built into this phase, not deferred.
**Delivers:** `scripts/spotify.js` fetch module with refresh-token exchange, Music section (last 5 tracks, horizontal scroll, album art).
**Addresses:** Spotify differentiator feature (music taste, personality signal).
**Avoids:** Spotify refresh token silently invalidated (Pitfall 1) — loud failure on token exchange, `spotify_ok: false` flag, failure notification; wrong endpoint / missing scope (Pitfall 10) — `recently-played` for track list, correct scope at token generation; album art CORS on local dev (Pitfall 15) — use `<img src>` directly, never `fetch()` for CDN images.
**Research flag:** Needs implementation care — Spotify refresh token expiry TTL should be verified against current Spotify documentation before implementation. One-time manual OAuth setup step (generating the refresh token) needs to be documented.

### Phase 5: Polish and Freshness Hardening

**Rationale:** Final phase ties together the cross-cutting concerns: staleness indicators, hover states, visual polish, and the UI-level freshness checks that gate live indicators on data age. These span multiple components and are easier to add once all sections are built.
**Delivers:** Staleness check (`updated_at` age > 30min suppresses PLAYING NOW badge and pulse animation), hover states (scale + glow on game cards and track items), responsive refinements, Steam capsule art `onError` fallbacks, final typography pass.
**Addresses:** Polish differentiators (terminal/monospace aesthetic for stats values, consistent hover states).
**Avoids:** Stale PLAYING NOW badge with permanent pulse (Pitfalls 6 and 14); Steam capsule art URL inconsistency (Pitfall 12).
**Research flag:** Standard patterns — CSS animation gating and hover states are straightforward.

### Phase Ordering Rationale

- Phase 1 before everything: validates the deployment pipeline independently of API complexity. A broken Vite `base` config is invisible until deployed — better to discover it with static content.
- Phase 2 before Phases 3-4: `data.json` schema must be defined before pipeline writes it or UI reads it. GitHub API requires no manual secret setup, making it the right first integration to validate the end-to-end data flow.
- Phase 3 before Phase 4: Steam is simpler (no OAuth refresh loop, no token expiry risk) — use it to prove the cron + conditional commit + multi-section data pattern before tackling Spotify.
- Phase 5 last: cross-cutting UI hardening is cleanest when all sections exist. Staleness checks reference multiple sections simultaneously.

### Research Flags

Phases likely needing deeper research or validation during planning:
- **Phase 3:** Steam profile privacy for Steam ID `76561198275331284` must be confirmed as "Public > Game details" — this is a prerequisite, not a code problem.
- **Phase 4:** Spotify refresh token expiry policy should be verified against current Spotify documentation before implementation. The one-time OAuth setup flow (generating the initial refresh token) needs a clear runbook.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Vite + Tailwind CSS v4 + GitHub Pages deployment is thoroughly documented with official guides. No ambiguity.
- **Phase 2:** GitHub GraphQL `pinnedItems` query is a well-known, stable API. Pattern is documented in multiple public repos.
- **Phase 5:** CSS polish and conditional class gating are standard React patterns.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommended technologies are at current stable releases. Tailwind v4 Vite plugin, React 18, Vite 6, React Query v5 are all well-documented. Versions confirmed as of mid-2025. |
| Features | MEDIUM | Based on training data across hundreds of public portfolio examples. Web verification was unavailable. Anti-features list is HIGH confidence (stable community consensus). Table stakes are MEDIUM. |
| Architecture | HIGH | The two-context pattern (Actions server / React browser / `data.json` contract) is the established solution for this exact use case. All component boundaries and data flows are logically derived from the constraints. |
| Pitfalls | MEDIUM-HIGH | Infinite loop, Vite base path, and GitHub cron suspension are HIGH (documented GitHub behaviors). Spotify token expiry TTL is MEDIUM (policy has changed before). Steam privacy blocking is HIGH (documented API behavior). |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Spotify refresh token expiry TTL:** Spotify does not publish an exact idle-token expiry period. The implementation should assume tokens can expire and build rotation handling from day one. Verify current policy at `developer.spotify.com` before the Spotify phase.
- **Steam profile privacy:** Confirm Steam ID `76561198275331284` has "Game details" set to Public in Steam privacy settings before writing the Steam fetch script. This is a user-account setting, not a code problem, and cannot be validated in code.
- **GitHub Actions minimum cron interval:** Documented as 5 minutes minimum; `*/10 * * * *` (every 10 minutes) is confirmed safe. No gap here, but verify the actual cron schedule runs at the expected frequency after initial deployment.
- **data.json schema minor discrepancy:** STACK.md and ARCHITECTURE.md use slightly different field naming conventions (`playtime_forever` vs `hoursTotal`, `img_capsule_url` vs `capsuleUrl`). Resolve the canonical schema in `src/types/data.ts` before writing any pipeline or UI code — both sides must match.

---

## Sources

### Primary (HIGH confidence)
- Vite documentation: https://vitejs.dev/guide/static-deploy.html — GitHub Pages deployment, `base` config
- GitHub Actions Pages actions: https://github.com/actions/deploy-pages — official deployment workflow
- Tailwind CSS v4 announcement: https://tailwindcss.com/blog/tailwindcss-v4 — Vite plugin integration
- React Query v5: https://tanstack.com/query/v5/docs/framework/react/overview — data fetching pattern
- Octokit GraphQL: https://github.com/octokit/graphql.js — pinned repos query
- GitHub Actions cron documentation: docs.github.com/en/actions — schedule trigger, `[skip ci]`, rate limits
- GitHub Pages documentation: docs.github.com/en/pages — source configuration, static serving behavior

### Secondary (MEDIUM confidence)
- Spotify Web API token docs: https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens — refresh token flow (training data, cutoff Aug 2025; verify token expiry policy before implementation)
- Steam Web API: https://developer.valvesoftware.com/wiki/Steam_Web_API — `GetPlayerSummaries`, `GetOwnedGames` endpoints (training data)
- GitHub GraphQL API: https://docs.github.com/en/graphql/reference/objects#pinnableitem — `pinnedItems` field (training data)
- Public portfolio repos and /r/webdev portfolio critique threads (training data, mid-2025 cutoff) — feature expectations and anti-feature patterns

### Tertiary (LOW confidence)
- Spotify idle refresh token expiry TTL — undocumented by Spotify; observed behavior in community reports. Treat as unreliable; build for token rotation regardless.

---
*Research completed: 2026-03-16*
*Ready for roadmap: yes*
