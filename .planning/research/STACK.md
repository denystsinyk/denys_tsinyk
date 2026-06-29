# Technology Stack

**Project:** Denys Tsinyk — Personal Portfolio Website
**Researched:** 2026-03-16
**Overall Confidence:** HIGH (well-established ecosystem, all components stable and widely used)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 18.3.x | UI component tree | Stable, broad ecosystem, hooks-based DX fits a small data-driven dashboard. React 19 is available but 18.3 LTS is safer for a project of this size — zero migration risk. |
| Vite | 6.x | Build tool + dev server | First-class React + TypeScript support, sub-second HMR, trivial GitHub Pages config via `base` option. Faster and simpler than CRA (dead) or webpack. |
| TypeScript | 5.x | Type safety | Catches prop mismatches for data.json shape early. Essential when API response shapes change. Use strict mode. |

### Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first CSS | v4 (released Feb 2025) removes the PostCSS config requirement — works as a Vite plugin directly. Ideal for dark/minimal aesthetics with explicit color tokens. Zero runtime, output is minimal. |
| CSS custom properties | native | Design tokens | Define `--color-bg: #0a0a0a`, `--color-accent: #00ff00`, `--font-mono`, `--font-sans` at `:root`. Reference in Tailwind config and raw CSS. Single source of truth for the design system. |

### Data Layer

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `public/data.json` | — | Runtime data for Steam, Spotify, GitHub stats | Fetched once on page load via `fetch('/data.json')`. No SDK, no client-side API keys. Shape is owned by the project — change without touching components. |
| React Query (`@tanstack/react-query`) | 5.x | Client-side data fetching + caching | One `useQuery` call to `fetch('/data.json')` gives loading/error states, stale-time control, and devtools for free. Overkill? No — it prevents manual `useEffect` + `useState` sprawl across every section. |

### GitHub Actions — Data Fetching

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Node.js script (`scripts/fetch-data.mjs`) | Node 20 LTS | Orchestrates Steam + Spotify + GitHub API calls | Native `fetch` in Node 18+ means zero HTTP library dependencies. One file, runs in GitHub Actions on cron. |
| `@octokit/graphql` | 8.x | GitHub GraphQL API | Required for pinned repos — the REST API does not expose pinned repositories. GraphQL also returns stars + primary language in one request. |
| Native `fetch` (Node 20 built-in) | — | Steam + Spotify HTTP calls | No `axios`, no `node-fetch` package needed since Node 18. Reduces attack surface and dependency count. |

### Deployment

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `actions/deploy-pages` | v4 | Deploy `dist/` to GitHub Pages | Official GitHub Action — no third-party trust required. Pairs with `actions/upload-pages-artifact` and `actions/configure-pages`. Replaces the older `peaceiris/actions-gh-pages` pattern. |
| `actions/configure-pages` | v5 | Sets Vite `base` automatically | Injects the correct base path for project repos (e.g., `/denys_tsinyk/`) so asset URLs don't 404. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite 6 | Create React App | CRA is unmaintained since 2023. Dead. |
| Build tool | Vite 6 | Next.js | SSR/RSC adds deployment complexity incompatible with static GitHub Pages. No benefit for this scope. |
| Styling | Tailwind CSS v4 | CSS Modules | CSS Modules fine but Tailwind v4 is faster to build dark-mode aesthetics with, especially hover states and glows. |
| Styling | Tailwind CSS v4 | styled-components / Emotion | Runtime CSS-in-JS adds bundle weight with no upside for a static portfolio. Avoid. |
| Data fetching | React Query v5 | SWR | Both are fine. React Query v5 has better devtools and a cleaner API since the v5 rewrite. Pick one; don't mix. |
| Data fetching | React Query v5 | Raw `useEffect` | Manual effect + state management for async leads to loading/error boilerplate in every component. React Query eliminates this. |
| GitHub Pages deploy | `actions/deploy-pages` | `peaceiris/actions-gh-pages` | `peaceiris` pushes to `gh-pages` branch, requires PAT. Official action uses Pages API — no branch management, no extra secrets. |
| GitHub API | `@octokit/graphql` | REST API only | REST API v3 does not expose pinned repos. GraphQL is the only way to query `pinnedItems`. |
| HTTP in scripts | Native `fetch` | `axios` / `node-fetch` | Node 20 has stable built-in fetch. External packages add version drift risk to a cron script. |
| Font stack | System fonts + Google Fonts | Self-hosted fonts | Google Fonts is fine for a portfolio. If privacy matters, use `fontsource` npm packages instead (same fonts, bundled). |

---

## Project Structure

```
denys_tsinyk/
├── public/
│   └── data.json          # Auto-generated by GitHub Actions; committed to repo
├── scripts/
│   └── fetch-data.mjs     # Node script: calls Steam, Spotify, GitHub APIs → writes data.json
├── src/
│   ├── components/
│   │   ├── Gaming.tsx
│   │   ├── Music.tsx
│   │   ├── Projects.tsx
│   │   ├── Stats.tsx
│   │   └── Footer.tsx
│   ├── hooks/
│   │   └── usePortfolioData.ts   # Single React Query hook wrapping fetch('/data.json')
│   ├── types/
│   │   └── data.ts               # TypeScript types matching data.json shape
│   ├── App.tsx
│   └── main.tsx
├── .github/
│   └── workflows/
│       ├── fetch-data.yml    # Cron: fetches APIs → commits data.json
│       └── deploy.yml        # On push to main: builds Vite → deploys to GitHub Pages
├── vite.config.ts
├── tailwind.config.ts        # (v4: may be vite plugin config only)
└── tsconfig.json
```

---

## Critical Configuration

### vite.config.ts — GitHub Pages base path

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Required for GitHub Pages project repos (username.github.io/repo-name/)
  // If using a custom domain or username.github.io root repo, set base: '/'
  base: process.env.VITE_BASE_PATH ?? '/',
})
```

The `actions/configure-pages` action sets `VITE_BASE_PATH` automatically in the deploy workflow. This means local dev always uses `/` and CI uses the correct `/repo-name/` path.

### .github/workflows/fetch-data.yml

```yaml
name: Refresh portfolio data

on:
  schedule:
    - cron: '*/10 * * * *'   # Every 10 minutes
  workflow_dispatch:           # Manual trigger for testing

jobs:
  fetch:
    runs-on: ubuntu-latest
    permissions:
      contents: write           # Required to commit data.json back to repo

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install script dependencies
        run: npm ci --workspace=scripts  # or: cd scripts && npm ci
        # Only @octokit/graphql needed — native fetch handles Steam + Spotify

      - name: Fetch API data
        env:
          STEAM_API_KEY: ${{ secrets.STEAM_API_KEY }}
          STEAM_ID: '76561198275331284'
          SPOTIFY_CLIENT_ID: ${{ secrets.SPOTIFY_CLIENT_ID }}
          SPOTIFY_CLIENT_SECRET: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
          SPOTIFY_REFRESH_TOKEN: ${{ secrets.SPOTIFY_REFRESH_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Auto-provided by Actions
        run: node scripts/fetch-data.mjs

      - name: Commit data.json
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add public/data.json
          git diff --staged --quiet || git commit -m "chore: refresh portfolio data [skip ci]"
          git push
```

The `[skip ci]` in the commit message prevents the deploy workflow from triggering on every data refresh — only code changes trigger a rebuild.

### .github/workflows/deploy.yml

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - uses: actions/configure-pages@v5
        id: pages

      - name: Build
        run: npm run build
        env:
          VITE_BASE_PATH: ${{ steps.pages.outputs.base_path }}

      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### data.json shape (TypeScript types)

```typescript
// src/types/data.ts
export interface PortfolioData {
  generated_at: string        // ISO timestamp of last fetch

  steam: {
    most_played: SteamGame[]  // Top 5 by playtime_forever
    currently_playing: SteamGame | null
  }

  spotify: {
    recent_tracks: SpotifyTrack[]  // Last 5
  }

  github: {
    pinned_repos: GithubRepo[]
    top_languages: { name: string; percentage: number }[]
    contribution_streak: number
  }
}

export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number      // minutes
  playtime_2weeks?: number      // minutes, present if played recently
  img_capsule_url: string       // https://cdn.akamai.steamstatic.com/steam/apps/{appid}/capsule_616x353.jpg
}

export interface SpotifyTrack {
  id: string
  name: string
  artist: string
  album: string
  album_art_url: string
  played_at: string             // ISO timestamp
  preview_url: string | null
}

export interface GithubRepo {
  name: string
  description: string | null
  url: string
  stars: number
  primary_language: string | null
  language_color: string | null
}
```

---

## Spotify Auth Pattern (cron-safe)

Spotify's access tokens expire in 1 hour. The cron workflow exchanges a stored refresh token for a new access token on each run. The refresh token itself does not expire (unless manually revoked).

Setup steps (one-time, developer does this):
1. Create a Spotify app at developer.spotify.com
2. Set redirect URI to `http://localhost:8888/callback`
3. Run an OAuth flow locally (any standard PKCE tool) with scope `user-read-recently-played`
4. Store the resulting refresh token in GitHub repo secret `SPOTIFY_REFRESH_TOKEN`
5. Store `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` as secrets

In `fetch-data.mjs`, exchange at runtime:

```javascript
const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
  },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: SPOTIFY_REFRESH_TOKEN,
  }),
})
const { access_token } = await tokenRes.json()
// use access_token for subsequent Spotify calls
```

---

## Installation

```bash
# Scaffold
npm create vite@latest denys_tsinyk -- --template react-ts
cd denys_tsinyk

# Core runtime
npm install @tanstack/react-query

# Tailwind CSS v4 (Vite plugin approach)
npm install tailwindcss @tailwindcss/vite

# Script dependencies (isolated — consider a scripts/package.json)
npm install @octokit/graphql
# No other HTTP libraries needed — Node 20 native fetch is sufficient

# Dev tooling
npm install -D @types/react @types/react-dom typescript eslint
```

### Tailwind v4 Vite integration

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

```css
/* src/index.css */
@import "tailwindcss";

:root {
  --color-bg: #0a0a0a;
  --color-accent: #00ff00;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

---

## What NOT to Use

| Technology | Reason to Avoid |
|------------|----------------|
| Next.js | SSR and App Router add deployment complexity. GitHub Pages is static-only. The `output: 'export'` mode works but loses RSC benefits — you'd be using Next for nothing. |
| Gatsby | Deprecated trajectory; GraphQL data layer is heavy overhead for a simple JSON file. |
| Remix | Requires a server runtime. Not deployable to GitHub Pages without workarounds. |
| `gh-pages` npm package | Pushes to a branch, requires write tokens, adds friction. Official `actions/deploy-pages` is cleaner. |
| `peaceiris/actions-gh-pages` | Third-party action requiring PAT secrets. Official action is preferred for security. |
| `axios` / `node-fetch` | Unnecessary in Node 18+. Native `fetch` is stable and built-in. |
| styled-components / Emotion | Runtime CSS-in-JS adds ~15KB and slows first paint. No benefit for a static portfolio. |
| Redux / Zustand | No shared mutable state between components. React Query + props is sufficient. |
| React Router | Single-page portfolio with no client-side routing. If deep links needed later, add then. |
| Firebase / Supabase | Backend services. The entire data strategy is `data.json` — no backend needed. |

---

## Sources

- Vite documentation: https://vitejs.dev/guide/static-deploy.html (GitHub Pages section)
- GitHub Actions Pages deployment: https://github.com/actions/deploy-pages
- Tailwind CSS v4 announcement and Vite plugin: https://tailwindcss.com/blog/tailwindcss-v4
- React Query v5: https://tanstack.com/query/v5/docs/framework/react/overview
- Octokit GraphQL: https://github.com/octokit/graphql.js
- Spotify refresh token flow: https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
- Steam Web API: https://developer.valvesoftware.com/wiki/Steam_Web_API
- GitHub GraphQL API (pinnedItems): https://docs.github.com/en/graphql/reference/objects#pinnableitem

**Confidence notes:**
- React 18 / Vite 6 / TypeScript 5 / React Query 5 versions: HIGH — confirmed stable releases as of mid-2025
- Tailwind CSS v4 Vite plugin approach: HIGH — v4 released February 2025, Vite plugin is the documented approach
- `actions/deploy-pages` v4 + `actions/configure-pages` v5: HIGH — official GitHub-maintained actions
- Node 20 native fetch in scripts: HIGH — stable since Node 18, Node 20 is current LTS
- Spotify refresh token not expiring: MEDIUM — documented behavior but Spotify has changed policies before; validate during implementation
