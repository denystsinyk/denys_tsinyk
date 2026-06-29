# Architecture Patterns

**Project:** Denys Tsinyk — Personal Portfolio
**Domain:** Static portfolio site with live API data pipeline
**Researched:** 2026-03-16
**Confidence:** MEDIUM — patterns are based on well-established static site + GitHub Actions conventions; no external verification was possible in this session (web access unavailable)

---

## Recommended Architecture

The system has two completely separate runtime contexts that share data through a single file (`public/data.json`). Getting this boundary right is the most important architectural decision.

```
┌─────────────────────────────────────────────────────────────┐
│                   GITHUB ACTIONS (server context)           │
│                                                             │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────────┐  │
│  │  Steam API   │  │  Spotify API  │  │   GitHub API    │  │
│  │  (key: secret│  │  (refresh tok)│  │  (public, rate) │  │
│  └──────┬───────┘  └───────┬───────┘  └────────┬────────┘  │
│         │                  │                    │           │
│         └──────────────────┼────────────────────┘           │
│                            ▼                                │
│                   ┌────────────────┐                        │
│                   │  fetch.js      │                        │
│                   │  (Node script) │                        │
│                   └───────┬────────┘                        │
│                           │ writes                          │
│                           ▼                                 │
│                   ┌────────────────┐                        │
│                   │ public/        │                        │
│                   │  data.json     │  ← auto-committed      │
│                   └───────┬────────┘                        │
└───────────────────────────┼─────────────────────────────────┘
                            │ git commit + push (main)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   REACT APP (browser context)               │
│                                                             │
│  App.jsx                                                    │
│  ├── useData() hook  ←── fetch("/data.json") on mount       │
│  │                                                          │
│  ├── <HeroSection />         (name, tagline, social links)  │
│  ├── <WorkSection />         (3 one-liner experiences)      │
│  ├── <ProjectsSection />     (pinned repos, stars, lang)    │
│  ├── <GithubStatsSection />  (top langs bar, streak)        │
│  ├── <GamingSection />       (top 5 Steam games)            │
│  ├── <MusicSection />        (last 5 Spotify tracks)        │
│  └── <Footer />              (social links)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │ vite build → dist/
                            ▼
                   ┌────────────────┐
                   │  GitHub Pages  │
                   │  (gh-pages     │
                   │   branch)      │
                   └────────────────┘
```

---

## Component Boundaries

### Server-Side Components (GitHub Actions only)

| Component | Responsibility | Inputs | Outputs |
|-----------|---------------|--------|---------|
| `scripts/fetch.js` | Orchestrates all API calls, normalizes responses, writes result | Env vars (secrets) | `public/data.json` |
| `scripts/steam.js` | Fetches top 5 most-played games + currently-playing status | `STEAM_API_KEY`, `STEAM_ID` | Steam slice of data.json |
| `scripts/spotify.js` | Exchanges refresh token → access token, fetches last 5 recently-played tracks | `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` | Spotify slice of data.json |
| `scripts/github.js` | Fetches pinned repos (GraphQL), top languages, contribution streak | `GITHUB_TOKEN` (optional, increases rate limit) | GitHub slice of data.json |
| `.github/workflows/refresh-data.yml` | Cron trigger, calls fetch.js, commits if data changed | Schedule (*/10 * * * *) | Committed data.json on main |

### Client-Side Components (React browser context)

| Component | Responsibility | Reads from data.json | Communicates With |
|-----------|---------------|---------------------|-------------------|
| `useData()` | Single fetch of `/data.json` on mount, shared app state | All fields | All section components |
| `<App />` | Root layout, passes data slices down | Full data object | All sections |
| `<HeroSection />` | Name, tagline, profession | `meta.*` | `<Footer />` (social links shared) |
| `<WorkSection />` | 3 experience one-liners (static, no API) | None (hardcoded in component) | None |
| `<ProjectsSection />` | Pinned repos, star counts, language badges | `github.pinnedRepos[]` | None |
| `<GithubStatsSection />` | Top languages bar chart, contribution streak | `github.topLanguages[]`, `github.streak` | None |
| `<GamingSection />` | Top 5 Steam games with capsule art, hours, PLAYING NOW badge | `steam.topGames[]`, `steam.currentlyPlaying` | None |
| `<MusicSection />` | Last 5 tracks, horizontal scroll row, album art | `spotify.recentTracks[]` | None |
| `<Footer />` | Social links: GitHub, LinkedIn, Email, Steam | `meta.socialLinks` | None |

---

## data.json Shape

This schema is the contract between the GitHub Actions pipeline and the React app. Define it early — everything else is built around it.

```json
{
  "meta": {
    "lastUpdated": "2026-03-16T12:00:00Z",
    "socialLinks": {
      "github": "https://github.com/username",
      "linkedin": "https://linkedin.com/in/username",
      "email": "mailto:user@example.com",
      "steam": "https://steamcommunity.com/profiles/76561198275331284"
    }
  },
  "steam": {
    "currentlyPlaying": null,
    "topGames": [
      {
        "appId": 730,
        "name": "Counter-Strike 2",
        "hoursTotal": 1234,
        "capsuleUrl": "https://cdn.cloudflare.steamstatic.com/steam/apps/730/capsule_616x353.jpg"
      }
    ]
  },
  "spotify": {
    "recentTracks": [
      {
        "trackName": "Track Name",
        "artistName": "Artist",
        "albumArt": "https://i.scdn.co/image/...",
        "spotifyUrl": "https://open.spotify.com/track/..."
      }
    ]
  },
  "github": {
    "pinnedRepos": [
      {
        "name": "repo-name",
        "description": "Short description",
        "url": "https://github.com/user/repo",
        "stars": 12,
        "primaryLanguage": "TypeScript",
        "languageColor": "#3178c6"
      }
    ],
    "topLanguages": [
      { "name": "TypeScript", "percent": 45, "color": "#3178c6" }
    ],
    "contributionStreak": {
      "currentStreak": 7,
      "longestStreak": 30
    }
  }
}
```

---

## Data Flow

### GitHub Actions Pipeline (runs every ~10 min)

```
Schedule trigger (cron)
  │
  ▼
Install Node deps (scripts/package.json)
  │
  ├── Parallel fetch:
  │   ├── Steam GetOwnedGames + GetRecentlyPlayedGames (REST, key in header)
  │   ├── Spotify token exchange (POST /api/token) → GET /me/player/recently-played
  │   └── GitHub GraphQL (pinnedItems, contributionsCollection)
  │
  ▼
Normalize + merge → data.json
  │
  ▼
git diff public/data.json (skip commit if no change)
  │
  ├── [changed] → git add public/data.json → git commit → git push
  └── [unchanged] → exit 0 (no commit noise)
```

Key: the "skip if unchanged" check is important — committing on every run would flood the git history with empty changes.

### React App (browser, page load)

```
Page load
  │
  ▼
App mounts → useData() runs fetch("/data.json")
  │
  ├── [loading] → Skeleton placeholders in each section
  │
  ▼
data.json resolves → state set, passed to all sections
  │
  ├── <GamingSection /> reads steam.topGames + steam.currentlyPlaying
  │   └── if currentlyPlaying !== null → render PLAYING NOW badge with pulse glow
  │
  ├── <MusicSection /> reads spotify.recentTracks
  │   └── horizontal scroll row, 5 items
  │
  ├── <ProjectsSection /> reads github.pinnedRepos
  │   └── language badge uses languageColor from data.json
  │
  └── <GithubStatsSection /> reads github.topLanguages + github.contributionStreak
      └── language bar: percent-based widths
```

---

## GitHub Actions Workflow Structure

The workflow has one job for data refresh, separate from the deploy job:

```
.github/
  workflows/
    refresh-data.yml    ← cron: "*/10 * * * *", writes data.json, commits
    deploy.yml          ← triggers on push to main, runs vite build, pushes dist/ to gh-pages
```

**`refresh-data.yml` job steps:**
1. `actions/checkout@v4` with `persist-credentials: true`
2. `actions/setup-node@v4` (Node 20)
3. `npm ci` in scripts directory
4. `node scripts/fetch.js` with all secrets as env vars
5. Check diff: `git diff --quiet public/data.json || (git config user.email ... && git add public/data.json && git commit -m "chore: refresh data [skip ci]" && git push)`

Note: `[skip ci]` in the commit message prevents the deploy workflow from re-triggering on every data refresh — only the data.json file changes, the site doesn't need a rebuild for data that's already in the file.

**`deploy.yml` job steps:**
1. Trigger: `on: push: branches: [main]` (but NOT data refresh commits — use `[skip ci]`)
2. `actions/checkout@v4`
3. `npm ci` in root
4. `npm run build` (Vite outputs to `dist/`)
5. `actions/deploy-pages@v4` or `peaceiris/actions-gh-pages@v3` to push `dist/` to `gh-pages` branch

**Warning:** Without `[skip ci]` on data refresh commits, you'll get a deploy-on-every-data-refresh loop. This is a common mistake with this pattern — see PITFALLS.md.

---

## Patterns to Follow

### Pattern 1: Single Data Fetch with Context

Fetch data.json once at the App level, distribute via React Context (or prop drilling for this scope). Do not fetch in individual components.

```typescript
// hooks/useData.ts
import { useState, useEffect } from 'react'
import type { SiteData } from '../types/data'

export function useData() {
  const [data, setData] = useState<SiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch('/data.json')
      .then(r => r.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
```

For this project's size (no routing, single page), pass data as props directly — no need for Context overhead.

### Pattern 2: Typed data.json Schema

Define TypeScript interfaces for data.json before building components. This prevents runtime shape mismatches when the pipeline changes a field name.

```typescript
// types/data.ts
export interface SiteData {
  meta: MetaData
  steam: SteamData
  spotify: SpotifyData
  github: GitHubData
}
// ... etc
```

### Pattern 3: Graceful Degradation per Section

Each section should render gracefully if its slice of data is null/empty — the pipeline can fail, Spotify can revoke the token, Steam can be rate-limited.

```typescript
// <GamingSection /> renders empty state, not crashed app
if (!data?.steam?.topGames?.length) {
  return <SectionSkeleton label="Gaming" />
}
```

### Pattern 4: Static Data Separate from Dynamic Data

Work experience (3 one-liners) is static — don't put it in data.json. Keep it in a `src/data/work.ts` constant. Only truly dynamic data (APIs that change) belongs in the pipeline.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Client-Side API Calls for Secrets

**What:** Calling Steam API or Spotify API directly from React (using CORS proxies, etc.)
**Why bad:** Steam API key exposed in browser devtools. Spotify refresh token visible to anyone who inspects the page. Also, Steam API does not support CORS — requests will fail in browser without a proxy.
**Instead:** All secret-dependent API calls stay in GitHub Actions. Only data.json is shipped to the browser.

### Anti-Pattern 2: One Workflow for Everything

**What:** Single workflow that fetches data AND deploys the site on every run.
**Why bad:** 10-minute cron triggers a full Vite build on every data refresh. Expensive, noisy, and slow. Deploy should only happen when source code changes.
**Instead:** Two separate workflows. `refresh-data.yml` (cron, commits data.json with `[skip ci]`). `deploy.yml` (push to main, but only real code changes trigger it).

### Anti-Pattern 3: Committing data.json on Every Run

**What:** `git add && git commit && git push` unconditionally every cron run.
**Why bad:** 144 commits/day of "chore: refresh data" with identical content. History becomes useless and PRs become noisy.
**Instead:** `git diff --quiet public/data.json || git commit` — only commit when the file actually changed.

### Anti-Pattern 4: Vite Base Path Misconfiguration

**What:** Not setting `base` in `vite.config.ts` when the repo isn't at the domain root.
**Why bad:** All asset URLs will be wrong (e.g., `/assets/index.js` instead of `/repo-name/assets/index.js`). Site loads a blank page on GitHub Pages.
**Instead:** Set `base: '/repo-name/'` in `vite.config.ts`, or use a custom domain (base stays `/`).

### Anti-Pattern 5: data.json in src/ instead of public/

**What:** Placing `data.json` inside `src/` and importing it as a module.
**Why bad:** The file gets bundled at build time — GitHub Actions updates to data.json won't be visible without a rebuild. It won't be dynamically refreshable.
**Instead:** Always place `data.json` in `public/`. Vite copies `public/` to `dist/` verbatim. `fetch('/data.json')` at runtime gets the latest version committed by GitHub Actions.

---

## Component Build Order

Dependencies between components drive the build sequence:

```
1. data.json schema (types/data.ts)
     └── Required by: everything. Define first.

2. scripts/fetch.js (GitHub Actions data pipeline)
     └── Produces: public/data.json
     └── Required by: all React sections
     └── Build this second — validates the data shape before building UI

3. useData() hook + App shell
     └── Required by: all section components
     └── Build third — establishes the data flow foundation

4. Section components (parallel, no inter-dependencies)
     ├── <WorkSection />         (static data, simplest — build first to prove layout)
     ├── <HeroSection />         (static + meta.socialLinks)
     ├── <Footer />              (meta.socialLinks)
     ├── <ProjectsSection />     (github.pinnedRepos)
     ├── <GithubStatsSection />  (github.topLanguages + streak)
     ├── <GamingSection />       (steam.* — most complex visual: PLAYING NOW badge, hover glows)
     └── <MusicSection />        (spotify.* — horizontal scroll)

5. GitHub Actions workflows
     ├── refresh-data.yml        (wire up secrets, test cron)
     └── deploy.yml              (wire up gh-pages deployment)
```

---

## Scalability Considerations

This is a personal portfolio — scalability is not a concern. The architectural constraints that matter are:

| Concern | Reality | Mitigation |
|---------|---------|------------|
| GitHub Actions rate limits for cron | Minimum 5-min interval enforced; ~10min is safe | Use `*/10 * * * *` as specified |
| Spotify token expiry | Access tokens expire in 1 hour; refresh token can be revoked | Always exchange refresh → access in the workflow, never store access token |
| Steam API rate limits | 100,000 calls/day limit; one call per run at 10min = 144/day — well under limit | No concern |
| GitHub API rate limits (unauthenticated) | 60 req/hr; pinned repos query = 1-2 calls per run = ~288/day — exceeds unauthenticated limit | Use `GITHUB_TOKEN` secret (5000 req/hr, always available in Actions) |
| data.json file size | 5 games + 5 tracks + pinned repos = <10KB | No concern |
| Cold page load | Single fetch of <10KB JSON on mount | No concern; faster than any image on the page |

---

## File Structure

```
denys_tsinyk/
├── public/
│   └── data.json                    ← written by GitHub Actions, read by React
├── src/
│   ├── types/
│   │   └── data.ts                  ← TypeScript interfaces for data.json
│   ├── hooks/
│   │   └── useData.ts               ← single fetch hook
│   ├── data/
│   │   └── work.ts                  ← static work experience (not in data.json)
│   ├── components/
│   │   ├── HeroSection.tsx
│   │   ├── WorkSection.tsx
│   │   ├── ProjectsSection.tsx
│   │   ├── GithubStatsSection.tsx
│   │   ├── GamingSection.tsx
│   │   ├── MusicSection.tsx
│   │   └── Footer.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── scripts/
│   ├── fetch.js                     ← orchestrator: calls steam/spotify/github, writes data.json
│   ├── steam.js
│   ├── spotify.js
│   ├── github.js
│   └── package.json                 ← separate deps for scripts (node-fetch, etc.)
├── .github/
│   └── workflows/
│       ├── refresh-data.yml         ← cron, fetches APIs, commits data.json
│       └── deploy.yml               ← push to main → build → gh-pages
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Sources

- Architecture derived from well-established static site + GitHub Actions data pipeline patterns (MEDIUM confidence — based on training knowledge; web verification unavailable in this session)
- Steam Web API endpoint structure: `api.steampowered.com/IPlayerService/GetOwnedGames`, `GetRecentlyPlayedGames` (HIGH confidence — stable, well-documented public API)
- Spotify token exchange flow: `/api/token` with `grant_type=refresh_token` (HIGH confidence — documented OAuth 2.0 pattern, unchanged for years)
- GitHub GraphQL `pinnedItems` query for pinned repos (HIGH confidence — stable GraphQL API)
- Vite `public/` directory behavior: files copied verbatim to `dist/`, accessible at root URL (HIGH confidence — core Vite feature, stable across versions)
- GitHub Actions `[skip ci]` keyword to prevent workflow loops (HIGH confidence — documented GitHub behavior)
- GitHub Actions minimum cron interval of 5 minutes (HIGH confidence — documented constraint)
- GitHub token rate limits: 60/hr unauthenticated, 5000/hr with GITHUB_TOKEN (HIGH confidence — documented)
