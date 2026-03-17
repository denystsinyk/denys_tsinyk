# Domain Pitfalls

**Domain:** Static personal portfolio with GitHub Actions data pipeline (React + Vite, GitHub Pages, Steam + Spotify + GitHub APIs)
**Researched:** 2026-03-16
**Confidence:** MEDIUM — training data (cutoff Aug 2025); web research tools unavailable in this session. All claims reflect well-documented, stable behaviors of these APIs and platforms.

---

## Critical Pitfalls

Mistakes that cause silent failures, broken deployments, or data going stale with no warning.

---

### Pitfall 1: Spotify Refresh Token Silently Invalidated

**What goes wrong:** The GitHub Actions workflow uses a Spotify refresh token stored as a secret. Spotify refresh tokens are not permanent — they are invalidated when: (a) the user revokes app access in their Spotify account, (b) the user changes their Spotify password, (c) the token has not been used for an extended period (Spotify does not publish an exact TTL, but idle tokens have been observed expiring in practice). When the token is invalid the workflow step fails, but if error handling is absent the `data.json` write step may be skipped, leaving the site serving stale or empty music data indefinitely with no visible warning.

**Why it happens:** Developers set the token once during initial setup and assume it is permanent. The OAuth refresh-token flow is only as durable as the user's continued consent and activity.

**Consequences:** Music section silently shows stale data or crashes if the JSON key is missing entirely. The pipeline keeps running (exit 0 if unchecked) and there is no alert.

**Prevention:**
- Use `set -e` or explicit `if` checks in the shell step that calls the Spotify token exchange. If the exchange returns a non-2xx status, fail the step loudly with `exit 1`.
- Write a `spotify_ok: false` flag into `data.json` when the exchange fails so the UI can render a "music data temporarily unavailable" fallback instead of crashing.
- Add a `workflow_run` or failure notification (GitHub Actions `on: failure` email or a Slack webhook) so token expiry is detected within one cycle rather than days later.
- Document the token rotation procedure in the repo README so it can be re-issued quickly.

**Detection:** Spotify section shows data frozen at a specific timestamp. Workflow run shows a non-zero exit in the Spotify fetch step, or the data.json `spotify.tracks` array is empty/absent.

**Phase to address:** Phase where Spotify integration is first wired into the Actions workflow.

---

### Pitfall 2: Steam Profile Privacy Blocking All Game Data

**What goes wrong:** Steam's `GetRecentlyPlayedGames` and `GetOwnedGames` endpoints return empty arrays — not an error — when the target Steam profile is set to "Private" or "Friends only" for game details. The API returns HTTP 200 with `{"response": {}}` or `{"response": {"games": []}}`. Code that does `data.games[0]` will throw or silently show nothing.

**Why it happens:** Steam's privacy controls are game-detail-level, not account-level. A profile can be public (visible) while game history is private. New Steam accounts and accounts that have ever toggled privacy default to a non-public game state.

**Consequences:** The gaming section renders empty or crashes. `GetRecentlyPlayedGames` specifically requires the profile's game details to be set to "Public" in Steam privacy settings. This is not an API key problem — the key works fine, it just returns no data.

**Prevention:**
- Verify Steam profile privacy is set to "Public > Game details" before wiring the workflow. The Steam ID `76561198275331284` in PROJECT.md must have this setting enabled.
- Add a guard in the fetch script: if `response.games` is undefined or empty, write a `steam_ok: false` flag to `data.json` and log a clear message: "Steam returned no games — check profile privacy settings."
- Never assume an empty array means "no games played." Treat it as a potential privacy block and surface it.

**Detection:** Workflow succeeds, `data.json` has empty `steam.games` array, no error logged. Gaming section is blank.

**Phase to address:** Phase where Steam API fetch script is written.

---

### Pitfall 3: GitHub Actions Cron Suspended on Inactive Repos

**What goes wrong:** GitHub automatically disables scheduled workflows (`on: schedule`) on repositories that have had no commit activity for 60 days. The workflow is silently disabled — no notification is sent. Once disabled, `data.json` stops updating. The site continues serving the last committed snapshot, which may be weeks old.

**Why it happens:** GitHub's policy for free-tier Actions resources: cron workflows on dormant repos are paused to conserve runner capacity. This is documented behavior but easily forgotten.

**Consequences:** Site data appears frozen. "Currently playing" badge may persist indefinitely on a game last played months ago. Music section shows tracks from the last active period.

**Prevention:**
- Add a `workflow_dispatch` trigger alongside `schedule` so the workflow can be manually triggered to re-enable it.
- Consider adding a trivial weekly commit to a non-essential file (e.g., a timestamp in `data/.last-ping`) via the workflow itself, which resets the 60-day clock.
- The auto-commit of `data.json` on each run naturally resets the inactivity clock — but only if the workflow is still running. Once suspended, there is no self-healing. A manual re-enable via the GitHub Actions UI or `gh workflow enable` is required.
- Set up a simple uptime monitoring URL (e.g., a cron-job.org ping) that hits the deployed site and checks a `data.json` timestamp field, alerting if it is older than 2 hours.

**Detection:** `data.json` `updated_at` timestamp is stale by more than 30 minutes. GitHub Actions UI shows the workflow as "disabled."

**Phase to address:** Phase where GitHub Actions cron workflow is set up.

---

### Pitfall 4: GitHub Pages Routing Breaks on Hard Refresh / Direct URL

**What goes wrong:** React SPA routing (e.g., React Router) uses the HTML5 History API. When a user hard-refreshes or navigates directly to any path other than `/`, GitHub Pages returns a 404 because the path does not correspond to a real file. GitHub Pages does not support server-side redirect rules.

**Why it happens:** GitHub Pages serves static files only. It has no `.htaccess`, no redirect rules, no catch-all for SPA routing.

**Consequences:** Any non-root URL returns GitHub's 404 page. Sharing links to anchored sections breaks.

**Prevention:**
- For a single-page portfolio, avoid React Router entirely. Use anchor links (`href="#section-id"`) and `IntersectionObserver` for scroll-based navigation. There are no routes to break.
- If routing is needed, use `HashRouter` (routes become `/#/path`) — GitHub Pages serves the root `index.html` and the hash fragment is client-side only.
- Do NOT use `BrowserRouter` + `basename` on GitHub Pages — it only works for the initial load, not hard refreshes to sub-paths.
- Vite's `base` config option in `vite.config.ts` must match the GitHub Pages subdirectory: `base: '/repo-name/'` if deploying to `username.github.io/repo-name`. A mismatch causes all assets (JS, CSS, images) to 404.

**Detection:** The deployed site loads at the root URL but all JS/CSS 404. Or: page works on first load but breaks on F5 at a non-root path.

**Phase to address:** Phase where Vite build + GitHub Pages deployment is configured.

---

### Pitfall 5: Vite `base` Misconfigured for GitHub Pages Subdirectory

**What goes wrong:** Vite generates absolute asset paths by default (e.g., `/assets/index-abc.js`). On GitHub Pages, if the site is hosted at `username.github.io/portfolio/`, the correct path is `/portfolio/assets/index-abc.js`. Without `base: '/portfolio/'` in `vite.config.ts`, every asset request 404s, the page loads blank, and the console shows a cascade of 404 errors.

**Why it happens:** Developers test locally with `vite dev` (root `/`) and everything works. The mismatch only surfaces after deployment.

**Consequences:** Deployed site is completely blank. This is the most common first-deploy failure for Vite + GitHub Pages.

**Prevention:**
- Set `base` in `vite.config.ts` to the repository name path: `base: process.env.NODE_ENV === 'production' ? '/repo-name/' : '/'`.
- Alternatively, use a custom domain (CNAME) so the site serves from root (`/`) and `base: '/'` works.
- Test the production build locally with `vite preview` before deploying: `npm run build && npm run preview`.

**Detection:** Deployed page is blank. Browser DevTools Network tab shows all JS/CSS returning 404 with paths missing the repo-name prefix.

**Phase to address:** Phase where Vite build + GitHub Pages deployment is first configured.

---

### Pitfall 6: data.json Stale State Not Handled in UI

**What goes wrong:** `data.json` is committed by the GitHub Actions cron. If the workflow fails (API down, token expired, rate-limited) the previous `data.json` remains. The UI has no way to know it is stale. A "PLAYING NOW" badge that was set 3 days ago will still show as green and active.

**Why it happens:** `data.json` is treated as ground truth with no freshness metadata. There is no `updated_at` field or `staleness_threshold` check in the UI.

**Consequences:** Misleading live-state indicators. The green pulse glow on "currently playing Steam game" becomes permanently lit if the workflow stopped running.

**Prevention:**
- Always include `updated_at: "<ISO timestamp>"` in `data.json` at the root level, written by the workflow on every successful run.
- In the UI, compute `ageMinutes = (Date.now() - new Date(data.updated_at)) / 60000`. If `ageMinutes > 30` (3× the cron interval), suppress all "live" indicators (PLAYING NOW badge, green pulse) and show a muted "last seen X ago" instead.
- For Spotify "currently playing" specifically: Spotify's `currently-playing` endpoint returns `null` when nothing is playing. The workflow should explicitly write `spotify.now_playing: null` in that case so the UI renders a fallback, not stale data from the previous run.

**Detection:** "PLAYING NOW" badge is visible but the Steam player page shows no active session, or the badge has been showing the same game for 24+ hours.

**Phase to address:** Phase where data.json schema is designed AND phase where live-state UI components are built.

---

### Pitfall 7: GitHub Actions Committing data.json Triggers Infinite Workflow Loop

**What goes wrong:** A cron workflow that auto-commits `data.json` back to the repo can trigger itself. If the workflow is also triggered by `on: push`, the commit from the cron run triggers another run, which commits again, creating an infinite loop that exhausts Actions minutes.

**Why it happens:** `on: push` + auto-commit is a classic feedback loop. Actions commits using `GITHUB_TOKEN` by default which, since 2021, does NOT re-trigger workflows — but this behavior is subtle and conditional. Third-party commit actions or PAT-authenticated commits DO re-trigger.

**Consequences:** Thousands of workflow runs, Actions minutes exhausted, repo commit history flooded, potential billing impact on paid plans.

**Prevention:**
- Use the default `GITHUB_TOKEN` for the auto-commit step, not a Personal Access Token (PAT). Commits made with `GITHUB_TOKEN` do not trigger `on: push` workflow runs (GitHub's built-in loop prevention).
- Explicitly do NOT add `on: push` to the data-pipeline workflow. Only `on: schedule` and `on: workflow_dispatch`.
- Use `git commit --allow-empty-message -m "chore: update data.json [skip ci]"` — the `[skip ci]` tag is a secondary safeguard recognized by GitHub Actions.
- If using `peaceiris/actions-gh-pages` or similar, ensure it uses `GITHUB_TOKEN`, not a deploy key or PAT.

**Detection:** GitHub Actions run history shows dozens of runs within minutes of each other. Commit history shows repeated `chore: update data.json` entries seconds apart.

**Phase to address:** Phase where GitHub Actions auto-commit is implemented.

---

## Moderate Pitfalls

---

### Pitfall 8: Steam `GetRecentlyPlayedGames` Is Not "Currently Playing"

**What goes wrong:** The Steam API does not have a reliable "is this player online and playing right now" endpoint in the public Web API. `GetRecentlyPlayedGames` returns games played in the last 2 weeks sorted by playtime — NOT live presence. `ISteamUser/GetPlayerSummaries` has a `gameextrainfo` field that shows the currently running game, but only if the user's "Online Status" is public AND a game is running at the exact moment the API is polled.

**Why it happens:** Developers assume "recently played" means "currently playing." The field names are misleading.

**Prevention:**
- Use `GetPlayerSummaries` for the "PLAYING NOW" badge — check the `gameextrainfo` field. If present, the user is actively running that game at workflow execution time.
- Use `GetRecentlyPlayedGames` for the "top 5 most played" list — this is what it is actually good for.
- Accept that "PLAYING NOW" will only be true if the workflow happened to run while a game session was active. The 10-minute cron means up to 10 minutes of lag. Document this clearly in the UI with "as of [timestamp]".

**Detection:** "PLAYING NOW" badge never fires even when actively playing, because `GetRecentlyPlayedGames` sort order is used instead of `GetPlayerSummaries`.

**Phase to address:** Phase where Steam API fetch script is written.

---

### Pitfall 9: GitHub API Rate Limits Hit by Unauthenticated Requests

**What goes wrong:** The GitHub REST API allows 60 requests/hour for unauthenticated callers (by IP). The GitHub Actions runner IP may be shared with other workflows, depleting the shared quota. Pinned repos require the GraphQL API (or `user.pinnedItems` via GraphQL), not the REST API.

**Why it happens:** Pinned repositories are not exposed via REST `GET /users/{user}/repos` — they are a GraphQL-only feature. REST returns all public repos sorted by various criteria, but not the user-curated "pinned" list.

**Prevention:**
- Authenticate all GitHub API calls in the workflow with `GITHUB_TOKEN` (gives 1,000 requests/hour per repo, more than sufficient).
- Use the GraphQL API for pinned repos: `query { user(login: "username") { pinnedItems(first: 6, types: REPOSITORY) { ... } } }`.
- Never make GitHub API calls client-side in the browser — use `data.json` exclusively. Client-side calls share the 60 req/hr unauthenticated limit with all visitors.

**Detection:** Workflow logs show `403 rate limit exceeded` or `422` from GitHub API. Pinned repos section always empty because REST was used instead of GraphQL.

**Phase to address:** Phase where GitHub data fetch is implemented in Actions workflow.

---

### Pitfall 10: Spotify `recently-played` vs `currently-playing` Endpoint Confusion

**What goes wrong:** Two Spotify endpoints exist: `me/player/recently-played` (last N tracks, always has data) and `me/player/currently-playing` (returns 204 No Content when nothing is playing). Using the wrong one for the wrong display purpose, or not handling 204, causes crashes or missing data.

**Why it happens:** Both endpoints require similar scopes (`user-read-recently-played` vs `user-read-currently-playing-track`) and developers mix them up.

**Prevention:**
- For "last 5 tracks" → use `me/player/recently-played?limit=5`. This always returns data as long as the account has any play history.
- For "currently playing" (if needed) → use `me/player/currently-playing`. Handle 204 explicitly: write `spotify.now_playing: null` to `data.json` when status is 204.
- Required OAuth scopes: ensure the refresh token was generated with `user-read-recently-played` scope. A token missing this scope returns 403 Forbidden, not a helpful error message.

**Detection:** Spotify section blank even though the token exchange succeeds. `data.json` has empty `spotify.tracks`. Check workflow logs for 403 on the tracks endpoint.

**Phase to address:** Phase where Spotify API fetch script is written.

---

### Pitfall 11: Missing `gh-pages` Branch Setup Causes Silent 404

**What goes wrong:** GitHub Pages can be served from `main` branch `/docs` folder or from a dedicated `gh-pages` branch. If the branch or folder does not exist, or the Pages setting in the repo has not been configured, the deployed URL returns a 404 with no error in the Actions workflow.

**Why it happens:** The build workflow succeeds and pushes to `gh-pages` branch correctly, but GitHub Pages is still configured to serve from `main` in repo settings (the default for new repos).

**Prevention:**
- After the first deployment, verify GitHub Pages source is set to the correct branch/folder: `Settings > Pages > Source`.
- Use `peaceiris/actions-gh-pages@v3` which auto-creates the `gh-pages` branch, or configure Vite's `build.outDir` to `docs/` and commit that.
- A custom domain + CNAME record simplifies everything: `base: '/'` works and there is no subdirectory path confusion.

**Detection:** Deployment workflow shows green but `https://username.github.io/repo-name/` returns 404. Check repo Settings > Pages source configuration.

**Phase to address:** Phase where GitHub Pages deployment is first configured.

---

## Minor Pitfalls

---

### Pitfall 12: Steam Capsule Art URL Format Inconsistency

**What goes wrong:** Steam game header/capsule images follow the URL pattern `https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg`. This URL is undocumented and unofficial — Steam does not guarantee its permanence. The `GetOwnedGames` endpoint returns `img_icon_url` and `img_logo_url` which are hash-based paths requiring a base URL construction. The formats are inconsistent between endpoints.

**Prevention:**
- Use `header.jpg` from the CDN pattern for large capsule art — it works reliably and has been stable for years.
- Fallback: if image returns 404, use a generic game controller placeholder SVG. Wrap all `<img>` elements with `onError` handlers.

**Phase to address:** Phase where Steam game cards UI is built.

---

### Pitfall 13: `data.json` Committed on Every Run Causes Noisy Git History

**What goes wrong:** A 10-minute cron creates ~144 commits/day in the default branch. This pollutes the commit graph, makes `git log` useless for actual development, and can confuse GitHub's contribution graph.

**Prevention:**
- Check if data actually changed before committing: `git diff --quiet data.json || git commit -m "..."`. Only commit if the JSON content changed.
- Alternatively, commit to a dedicated orphan branch (`data` branch) separate from `main` so development history stays clean.

**Phase to address:** Phase where GitHub Actions auto-commit script is written.

---

### Pitfall 14: CSS `animation: pulse` on Green Glow Runs Permanently

**What goes wrong:** The "PLAYING NOW" green pulse glow uses a CSS animation. If data.json is stale and the badge is permanently shown, the pulsing animation runs forever. On low-power devices this is a minor but unnecessary battery/CPU drain. More importantly it looks wrong — a pulsing live indicator on 3-day-old data.

**Prevention:**
- Gate the pulse animation class on the staleness check from Pitfall 6. Only add `class="live-pulse"` when `data.updated_at` is within the freshness window.

**Phase to address:** Phase where live-state UI components are built.

---

### Pitfall 15: Spotify Album Art Mixed-Content or CORS on Local Dev

**What goes wrong:** Spotify album art URLs are `https://i.scdn.co/...`. They load fine in the browser. However, during local development with `vite dev`, if album art URLs are constructed incorrectly or loaded through a proxy, CORS errors can appear. This is a dev-environment-only issue — the deployed static site loads album art directly from Spotify's CDN with no CORS issues.

**Prevention:**
- Always use album art URLs directly in `<img src>` tags. Browsers do not enforce CORS on `<img>` elements. Only `fetch()` / `XMLHttpRequest` calls are CORS-restricted.
- Do not proxy Spotify CDN URLs through a local dev server.

**Phase to address:** Phase where Music section UI is built.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| GitHub Actions cron setup | Infinite loop from auto-commit triggering push event | Use `GITHUB_TOKEN` for commit, no `on: push` trigger, add `[skip ci]` |
| GitHub Actions cron setup | Cron suspended after 60 days inactivity | data.json auto-commit resets clock; add `workflow_dispatch` trigger |
| Spotify fetch script | Refresh token silently invalid | Fail loudly on token exchange error; write `spotify_ok: false` flag |
| Spotify fetch script | Wrong endpoint / missing scope | `recently-played` for track list; verify scopes at token generation time |
| Steam fetch script | Empty response due to private profile | Check `steam_ok` flag; log clear message about privacy settings |
| Steam fetch script | `GetRecentlyPlayedGames` used for "now playing" | Use `GetPlayerSummaries.gameextrainfo` for live badge |
| GitHub data fetch | Pinned repos not available via REST | Use GraphQL API for pinned repos; authenticate with `GITHUB_TOKEN` |
| data.json schema design | No freshness metadata | Include `updated_at` ISO timestamp at root level |
| Live-state UI components | Stale "PLAYING NOW" badge | Check `updated_at` age; suppress live indicators if data is >30 min old |
| Vite + GitHub Pages deploy | Asset 404s due to wrong `base` path | Set `base: '/repo-name/'` in `vite.config.ts` for subdirectory deployments |
| GitHub Pages config | Pages serving wrong branch | Verify Settings > Pages source after first deploy |
| Git history | 144 commits/day from cron | Conditional commit: only write if JSON content changed |

---

## Sources

- Steam Web API documentation (developer.valvesoftware.com/wiki/Steam_Web_API) — MEDIUM confidence (training data, Aug 2025 cutoff)
- Spotify Web API token documentation (developer.spotify.com/documentation) — MEDIUM confidence (training data)
- GitHub Actions schedule trigger documentation (docs.github.com/en/actions) — HIGH confidence (well-documented, stable behavior, training data)
- GitHub Pages documentation (docs.github.com/en/pages) — HIGH confidence (stable behavior, training data)
- Vite static deployment guide (vitejs.dev/guide/static-deploy) — HIGH confidence (stable, training data)

**Note:** Web research tools were unavailable during this session. All findings are based on training data (cutoff August 2025) reflecting well-established, stable behaviors. The Spotify refresh token expiry TTL specifically should be re-verified against current Spotify documentation before implementation, as this policy has changed in the past.
