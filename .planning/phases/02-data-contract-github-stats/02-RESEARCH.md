# Phase 2: Data Contract + GitHub Stats - Research

**Researched:** 2026-03-17
**Domain:** TypeScript schema design, GitHub GraphQL API, GitHub Actions cron pipeline, React data-fetching hook
**Confidence:** HIGH (official docs verified for all critical paths)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Repo Card Layout**
- Grid layout: 2-3 columns (responsive), GitHub-profile-style arrangement
- One line of description per card, truncated with ellipsis if too long
- Language badge: GitHub-style colored dot + language name (e.g., ● TypeScript)
- Star count shown on each card
- Clicking a card opens the repo in a new tab

**Schema Design**
- Stub Steam and Spotify fields in data.json now (steam_ok, spotify_ok, steam: {}, spotify: {}) — typed but empty — so fallback logic works from Phase 2 onward
- TypeScript types use strict nullability: `currently_playing: string | null`, not optional `?` fields — forces null handling in all components
- GitHub username and other config live in GitHub Actions env vars / repo variables (never hardcoded)
- Pipeline fetches up to 6 pinned repos (GitHub's default pinned limit) to fill a 2×3 or 3×2 grid

**Fallback States**
- When `steam_ok` is false: gaming section remains visible with a subtle "gaming stats unavailable" message — honest about the state, not hidden
- When `spotify_ok` is false: music section remains visible with a "music unavailable" message — consistent with gaming fallback
- Footer `updated_at` shows relative time: "updated 8 minutes ago" — human-readable freshness indicator
- If the GitHub fetch fails: pipeline keeps existing data.json unchanged (silent last-good-data), the `updated_at` timestamp reveals staleness — no explicit github_ok flag needed

### Claude's Discretion
- Exact wording of fallback messages (e.g., "gaming stats unavailable" vs "Steam data unavailable")
- Visual style of fallback placeholder (subtle gray text vs bordered placeholder card)
- Top languages bar and contribution streak visual design (bar chart, pills, or ranked list)
- Loading skeleton approach (if any) during initial page render

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FNDN-03 | Canonical `data.json` schema defined with TypeScript types in `src/types/data.ts` as the contract between pipeline and UI | Schema design pattern with strict nullability; `src/types/` directory needs to be created |
| FNDN-04 | `useData()` hook loads `data.json` on mount and exposes loading, error, stale, and data states to all sections | React `useEffect` + `fetch` pattern; `public/data.json` served via Vite's `BASE_URL`; no library needed |
| PIPE-01 | GitHub Actions `refresh-data.yml` runs on ~10-min cron, fetches Steam + Spotify + GitHub APIs using repo secrets, commits `public/data.json` with `[skip ci]` | GitHub Actions cron minimum is 5 min; GITHUB_TOKEN with `contents: write` for commit back; stub Steam/Spotify fetch in this phase |
| PIPE-02 | `data.json` includes `updated_at` ISO timestamp at root level, displayed in footer | Simple ISO string from `new Date().toISOString()`; relative time formatting in UI (no library, pure JS Date math) |
| PIPE-03 | `data.json` includes `steam_ok` and `spotify_ok` boolean flags; UI shows fallback when false | Typed as `boolean` in schema; pipeline sets `false` when fetch fails, `true` on success |
| PROJ-01 | Pinned GitHub repos auto-fetched via GitHub GraphQL, each card showing name, description, star count, primary language badge | GitHub GraphQL `user.pinnedItems(first: 6, types: REPOSITORY)` query; auth via `GH_PAT` secret |
| PROJ-02 | Each project card clickable, opens repo URL in new tab | `url` field from GraphQL `Repository.url`; standard `<a target="_blank" rel="noopener noreferrer">` |
| PROJ-03 | GitHub stats bar: top languages and contribution streak from GitHub API | `contributionsCollection.contributionCalendar.weeks[].contributionDays[]` for streak calc; top languages computed from pinned repo `primaryLanguage` or via separate REST call |
</phase_requirements>

---

## Summary

Phase 2 has two distinct concerns: (1) locking the TypeScript data contract in `src/types/data.ts` that all future phases will import, and (2) wiring a GitHub Actions cron pipeline that writes `public/data.json` from live GitHub GraphQL API data. The UI side renders two new sections — pinned repos grid and GitHub stats bar — reading exclusively from `data.json` via a new `useData()` hook.

The architectural pattern is clean: GitHub Actions writes `public/data.json` → Vite serves it statically → `useData()` fetches it on mount → section components render from the typed payload. No runtime API calls from the browser. The pipeline uses the GitHub GraphQL API (authenticated via a PAT stored as `GH_PAT` repo secret) to fetch pinned repos and contribution data in a single or two-query call. Steam and Spotify fields are stubbed with `steam_ok: false` and empty objects in this phase — full fetch logic lands in Phases 3 and 4.

The only complexity to manage is: (a) the git commit-back pattern in GitHub Actions (configure user + `git add` + `git commit --allow-empty-message -m "[skip ci]"` pattern), (b) contribution streak computation from raw calendar day data (no GitHub API field for "streak" — must derive from `contributionDays`), and (c) the `useData()` hook must handle stale data detection via `updated_at` age comparison.

**Primary recommendation:** Use GitHub GraphQL for pinned repos + contributions in one call; compute streak client-side from `contributionCalendar.weeks` days; GITHUB_TOKEN is sufficient for commit-back with `contents: write` permission declared in the workflow.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React built-in (`useEffect`, `useState`) | 18.3.x (already installed) | `useData()` hook implementation | No additional dependency needed; simple fetch pattern |
| TypeScript | ~5.6.2 (already installed) | `src/types/data.ts` schema contract | Strict mode already enabled; all types enforced at compile time |
| GitHub GraphQL API | v4 (stable) | Fetch pinned repos + contribution calendar | Only API that exposes `pinnedItems` and `contributionsCollection` |
| GitHub Actions | N/A | Cron pipeline, `refresh-data.yml` | Already used for `deploy.yml`; same runner, same pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node-fetch` or native `fetch` (Node 18+) | Built-in | HTTP calls inside pipeline script | GitHub Actions uses Node 18+; no install needed |
| `@actions/core` | optional | Logging in Actions scripts | Only if structured logging is needed; `console.log` works fine |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled `useEffect` fetch | SWR / React Query | SWR adds 4KB but brings auto-revalidation; overkill for a static JSON file refreshed externally |
| GraphQL manual `fetch` | `@octokit/graphql` | Octokit adds structured types; not needed for a single query in a Node script |
| PAT secret (`GH_PAT`) | `GITHUB_TOKEN` for GraphQL | `GITHUB_TOKEN` in Actions can call GraphQL; works if `read:user` scope is sufficient for `pinnedItems` |

**Installation:** No new npm packages needed for this phase. All tooling (Node, TypeScript, React) is already present.

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── types/
│   └── data.ts          # canonical data.json TypeScript contract (new)
├── hooks/
│   └── useData.ts        # useData() hook (new)
├── components/
│   ├── HeroSection.tsx   # existing
│   ├── WorkSection.tsx   # existing
│   ├── Footer.tsx        # update: add updated_at timestamp display
│   ├── ProjectsSection.tsx  # new: repo cards grid
│   └── GitHubStatsSection.tsx  # new: top languages + streak bar
├── data/
│   ├── social.ts         # existing
│   └── work.ts           # existing
├── App.tsx               # update: wire useData(), add new sections
└── ...

public/
└── data.json             # written by pipeline, served statically

.github/workflows/
├── deploy.yml            # existing
└── refresh-data.yml      # new: cron pipeline

scripts/
└── fetch-github-data.js  # new: Node script invoked by pipeline
```

### Pattern 1: data.json TypeScript Contract

**What:** A single `src/types/data.ts` file defines the complete payload structure. The pipeline's output and every UI component import from this file.

**When to use:** Always — this is the architectural contract for Phases 2-5.

**Example:**
```typescript
// src/types/data.ts
export interface PinnedRepo {
  name: string
  description: string | null
  url: string
  stargazerCount: number
  primaryLanguage: { name: string; color: string | null } | null
}

export interface GitHubStats {
  topLanguages: { name: string; color: string | null; count: number }[]
  contributionStreak: number
  totalContributionsThisYear: number
}

export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  img_icon_url: string
}

export interface SteamData {
  top_games: SteamGame[]
  currently_playing: SteamGame | null
}

export interface SpotifyTrack {
  name: string
  artist: string
  album_art: string | null
  spotify_url: string
}

export interface SpotifyData {
  recent_tracks: SpotifyTrack[]
  currently_playing: string | null
}

export interface SiteData {
  updated_at: string          // ISO 8601 timestamp
  steam_ok: boolean
  spotify_ok: boolean
  github: {
    pinned_repos: PinnedRepo[]
    stats: GitHubStats
  }
  steam: SteamData
  spotify: SpotifyData
}
```

**Key decisions reflected:**
- All nullable fields use `Type | null` not `Type?` — forces explicit null handling
- `steam` and `spotify` are fully typed but populated with empty arrays in Phase 2 (`steam_ok: false`, `spotify_ok: false`)
- `github` is a nested object, not root-level, for grouping

### Pattern 2: useData() Hook

**What:** Single hook that fetches `public/data.json` on mount, exposes typed state.

**When to use:** Import in App.tsx, pass data down to section components via props.

**Example:**
```typescript
// src/hooks/useData.ts
import { useEffect, useState } from 'react'
import type { SiteData } from '../types/data'

interface UseDataResult {
  data: SiteData | null
  loading: boolean
  error: string | null
  isStale: boolean   // true if updated_at is > 30 min old
}

export function useData(): UseDataResult {
  const [data, setData] = useState<SiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<SiteData>
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  const isStale = data
    ? Date.now() - new Date(data.updated_at).getTime() > 30 * 60 * 1000
    : false

  return { data, loading, error, isStale }
}
```

**Key detail:** Use `import.meta.env.BASE_URL` (not `import.meta.env.VITE_BASE_PATH`) — Vite sets `BASE_URL` automatically from the `base` config. This already works in `HeroSection.tsx` for the headshot image.

### Pattern 3: GitHub GraphQL pinnedItems Query

**What:** Single GraphQL query fetching pinned repos and contribution calendar.

**Endpoint:** `POST https://api.github.com/graphql`

**Auth:** `Authorization: bearer TOKEN` header with a PAT that has `read:user` + `repo:read` (public repos only is sufficient).

**Example:**
```javascript
// scripts/fetch-github-data.js
const query = `
  query($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            primaryLanguage {
              name
              color
            }
          }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`
```

**Auth in pipeline:**
```yaml
env:
  GH_TOKEN: ${{ secrets.GH_PAT }}
  GH_LOGIN: ${{ vars.GITHUB_USERNAME }}   # or hardcode in script
```

**Note on `GITHUB_REPOSITORY_OWNER`:** GitHub Actions automatically provides `github.repository_owner` context variable, which equals the repo owner's username. Use `${{ github.repository_owner }}` in the workflow — no manual variable needed.

### Pattern 4: Contribution Streak Computation

**What:** GitHub GraphQL does not expose a `streak` field. Compute it from `contributionCalendar.weeks[].contributionDays[]`.

**Algorithm:**
```javascript
function computeStreak(weeks) {
  // Flatten all days, sorted descending by date
  const days = weeks
    .flatMap(w => w.contributionDays)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // Walk backwards from today; count consecutive days with count > 0
  let streak = 0
  for (const day of days) {
    if (day.contributionCount > 0) {
      streak++
    } else {
      break
    }
  }
  return streak
}
```

**Limitation:** The `contributionsCollection` defaults to the current year. Streak crossing a year boundary requires fetching prior year too. For v1, current-year-only is acceptable — flag as a known gap.

### Pattern 5: Pipeline Git Commit-Back

**What:** After writing `public/data.json`, the pipeline must commit and push it.

**Example workflow step:**
```yaml
- name: Commit updated data.json
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add public/data.json
    git diff --cached --quiet || git commit -m "chore: refresh data [skip ci]"
    git push
```

**Why `git diff --cached --quiet ||`:** If data didn't change (no new activity since last run), skip the commit entirely. Avoids empty commits.

**Required workflow permission:**
```yaml
permissions:
  contents: write   # enables push to main
```

**`[skip ci]` in the commit message** prevents the `deploy.yml` workflow from triggering a full site rebuild on every data refresh commit.

### Anti-Patterns to Avoid

- **Fetching GitHub API from the browser:** Exposes PAT in client bundle and hits browser CORS restrictions. All API calls belong in the pipeline.
- **Using `?` optional fields instead of `| null`:** Breaks the forcing function; components can ignore the undefined case. Use `null` + explicit null handling.
- **Hardcoding GitHub username in source:** Use `${{ github.repository_owner }}` in workflow or a repo variable — never in committed source files.
- **No `[skip ci]` on data commits:** Triggers deploy rebuild on every 10-minute cron run, consuming Actions minutes unnecessarily.
- **Not checking for empty diff before commit:** Creates empty commits when no data changed, cluttering git history.
- **Fetching `data.json` with a relative path:** Use `import.meta.env.BASE_URL` prefix — the existing codebase already does this in `HeroSection.tsx` for the headshot.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Relative time ("8 minutes ago") | Custom `formatRelativeTime()` | `Intl.RelativeTimeFormat` (built-in browser API) | Handles edge cases, locale support, no library needed |
| Language color mapping | Static color lookup table | GitHub GraphQL `primaryLanguage.color` field | Returns the exact hex color GitHub uses on profiles |
| Pinned repo data | Scraping GitHub profile HTML | `pinnedItems` GraphQL query | Official API, stable, returns exactly 6 items |
| Contribution streak | Calling a third-party GitHub stats service | Compute from `contributionCalendar.weeks` | First-party data, no third-party dependency or rate-limit concerns |

**Key insight:** GitHub's GraphQL API gives you `primaryLanguage.color` directly — no need to maintain a language-to-color map.

---

## Common Pitfalls

### Pitfall 1: GITHUB_TOKEN vs PAT for GraphQL `pinnedItems`

**What goes wrong:** The auto-provided `GITHUB_TOKEN` in Actions may lack `read:user` scope needed to read another user's pinned items via GraphQL if the token is installation-scoped.

**Why it happens:** `GITHUB_TOKEN` is scoped to the repository; reading user-level GraphQL data (like `pinnedItems`) may require a personal access token with `read:user`.

**How to avoid:** Store a PAT as `GH_PAT` repository secret. Use it in the pipeline script instead of `GITHUB_TOKEN`. Classic PAT with `read:user` and `public_repo` scopes is sufficient.

**Warning signs:** GraphQL returns `null` for `pinnedItems` even when repos are pinned; or 401/403 on the GraphQL endpoint.

### Pitfall 2: `BASE_URL` vs `VITE_BASE_PATH` for fetch path

**What goes wrong:** Fetching `data.json` with a hardcoded `/data.json` path works locally but 404s on GitHub Pages at `/denys_tsinyk/data.json`.

**Why it happens:** GitHub Pages serves the site at a subpath. Vite's `base` config prepends this path, but only if you use `import.meta.env.BASE_URL`.

**How to avoid:** Always prefix static asset paths with `import.meta.env.BASE_URL`. The existing `HeroSection.tsx` already does this correctly:
```typescript
src={`${import.meta.env.BASE_URL}headshot.jpg`}
```
Apply the same pattern: `fetch(`${import.meta.env.BASE_URL}data.json`)`.

### Pitfall 3: Contribution streak crossing year boundary

**What goes wrong:** `contributionsCollection` defaults to the current calendar year. A streak starting in December of the prior year will be cut off.

**Why it happens:** The `from`/`to` arguments on `contributionsCollection` default to Jan 1 of the current year.

**How to avoid:** For v1, accept this limitation — streak resets at year boundary. For v2, pass `from: one_year_ago` to the query. Document this as a known gap.

### Pitfall 4: Empty commit on unchanged data

**What goes wrong:** If no activity happened since the last cron run, `git commit` fails with "nothing to commit" and the pipeline errors.

**How to avoid:** Use `git diff --cached --quiet || git commit -m "..."` — the `||` only runs commit if there are staged changes.

### Pitfall 5: TypeScript strict mode with data.json parse

**What goes wrong:** `response.json()` returns `unknown` in strict TypeScript. `as SiteData` cast works but bypasses runtime validation. Malformed pipeline output breaks the UI silently.

**How to avoid:** Add a minimal type guard or use a try/catch with a fallback null state. For v1, a typed cast with a null fallback in the hook's catch block is acceptable. The `useData()` hook already handles errors.

### Pitfall 6: Tailwind v4 inline styles vs class names

**What goes wrong:** Trying to use dynamic language colors (hex strings from GitHub API) as Tailwind classes — Tailwind can't generate classes for runtime values.

**Why it happens:** Tailwind v4 (like v3) only generates classes for statically-analyzable strings.

**How to avoid:** Use inline `style={{ backgroundColor: lang.color ?? '#888' }}` for the language color dot. Use Tailwind classes for layout/spacing only.

---

## Code Examples

### GitHub GraphQL Call (pipeline script)

```javascript
// scripts/fetch-github-data.js
// Source: https://docs.github.com/en/graphql/guides/forming-calls-with-graphql

async function fetchGitHubData(login, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `query($login: String!) {
        user(login: $login) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                name
                description
                url
                stargazerCount
                primaryLanguage { name color }
              }
            }
          }
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays { contributionCount date }
              }
            }
          }
        }
      }`,
      variables: { login }
    })
  })
  if (!res.ok) throw new Error(`GitHub GraphQL error: ${res.status}`)
  const { data } = await res.json()
  return data.user
}
```

### refresh-data.yml Workflow (skeleton)

```yaml
# .github/workflows/refresh-data.yml
name: Refresh Data

on:
  schedule:
    - cron: '*/10 * * * *'   # every 10 minutes

permissions:
  contents: write             # required for git push

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Fetch data
        run: node scripts/fetch-github-data.js
        env:
          GH_TOKEN: ${{ secrets.GH_PAT }}
          GH_LOGIN: ${{ github.repository_owner }}

      - name: Commit updated data.json
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add public/data.json
          git diff --cached --quiet || git commit -m "chore: refresh data [skip ci]"
          git push
```

### Relative Time Formatting (UI, no library)

```typescript
// Source: MDN Intl.RelativeTimeFormat
function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (diffMin < 60) return rtf.format(-diffMin, 'minute')
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return rtf.format(-diffHr, 'hour')
  return rtf.format(-Math.floor(diffHr / 24), 'day')
}
// Output: "8 minutes ago", "2 hours ago", "3 days ago"
```

### Repo Card Language Badge

```tsx
// Tailwind for layout, inline style for dynamic hex color
function LanguageBadge({ lang }: { lang: { name: string; color: string | null } }) {
  return (
    <span className="flex items-center gap-1 text-xs">
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ backgroundColor: lang.color ?? '#888888' }}
      />
      {lang.name}
    </span>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GitHub REST API for repos | GitHub GraphQL v4 for pinned repos | ~2019 | GraphQL is the only way to access `pinnedItems` — REST doesn't expose pinned repos |
| `node-fetch` npm package | Native `fetch` in Node 18+ | Node 18 (2022) | No install needed for pipeline scripts |
| `GITHUB_TOKEN` write by default | Must declare `permissions: contents: write` | 2021 (Actions hardening) | Workflows fail silently without explicit `contents: write` declaration |
| Python/bash pipeline scripts | Node.js pipeline scripts | Ongoing | Node is already the project runtime; consistent tooling |

**Deprecated/outdated:**
- `v3-cache` actions: replaced by `actions/cache@v4` — already using v4 in `deploy.yml`
- `set-output` workflow command: deprecated in 2022; replaced by `$GITHUB_OUTPUT` — not needed for this phase but relevant if future scripts output data

---

## Open Questions

1. **PAT scope for `pinnedItems`**
   - What we know: GraphQL endpoint requires `Authorization: bearer TOKEN`; `pinnedItems` is on the `user` object
   - What's unclear: Whether `GITHUB_TOKEN` (auto) or only a PAT can access `user.pinnedItems` for the authenticated user's own account
   - Recommendation: Use a PAT (`GH_PAT` secret) with `read:user` + `public_repo` scopes to guarantee access; test with `GITHUB_TOKEN` as a stretch optimization after initial implementation

2. **Top languages source**
   - What we know: `primaryLanguage` on pinned repos gives one language per repo; this is coarse
   - What's unclear: Whether to derive "top languages" from pinned repo primary languages (simple, same query) or from a separate REST call to list all user repos
   - Recommendation: Derive from pinned repos' `primaryLanguage` in Phase 2 (count occurrences, sort descending); a more accurate "all repos" approach can be a Phase 5 enhancement

3. **Cron suspension after 60 days of repo inactivity**
   - What we know: GitHub automatically disables scheduled workflows after 60 days of no repository activity (official docs confirmed)
   - What's unclear: Whether the data pipeline commits count as "repository activity" to reset the 60-day timer
   - Recommendation: The `[skip ci]` commit from the pipeline itself should count as activity. Document this behavior; add `workflow_dispatch` in a later enhancement (PIPE-04 is v2)

---

## Sources

### Primary (HIGH confidence)
- `https://docs.github.com/en/graphql/guides/forming-calls-with-graphql` — GraphQL endpoint URL, auth header format, curl example
- `https://docs.github.com/en/graphql/overview/resource-limitations` — Rate limits: 5,000 points/hour for users; 1,000/hour for Actions; GraphQL queries cost 1 point
- `https://docs.github.com/en/graphql/reference/objects#contributionscollection` — `totalCommitContributions`, `contributionCalendar` field confirmed
- `https://docs.github.com/en/graphql/reference/objects#contributionscalendar` — `weeks`, `contributionDays`, `contributionCount`, `date` fields confirmed; no built-in streak field
- `https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule` — Minimum cron interval 5 min; cron disabled after 60 days inactivity; runs on default branch only
- `https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables` — `vars` context for repo variables; `${{ vars.VARIABLE_NAME }}` syntax
- `https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions` — `${{ secrets.SECRET_NAME }}` syntax; GITHUB_TOKEN vs custom secrets
- `https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28` — REST repo fields: `stargazers_count`, `language`, `description`, `html_url` (confirmed as cross-reference)

### Secondary (MEDIUM confidence)
- WebSearch training knowledge (verified structurally): `pinnedItems(first: 6, types: REPOSITORY)` query structure with `... on Repository` fragment — standard GraphQL polymorphism pattern; consistent with official schema patterns
- `github.repository_owner` context variable — standard GitHub Actions context; confirmed pattern from existing `deploy.yml` usage of `steps.pages.outputs.base_path`

### Tertiary (LOW confidence)
- Whether `GITHUB_TOKEN` (vs PAT) can access `user.pinnedItems` in GraphQL — needs empirical test; flagged as Open Question 1

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — No new libraries; all tooling already in project
- Architecture: HIGH — Official docs confirmed GraphQL endpoint, query structure, Actions cron, git commit-back pattern
- Pitfalls: HIGH — BASE_URL pitfall verified from existing codebase pattern; Tailwind dynamic class pitfall well-established; GITHUB_TOKEN scope is a genuine open question
- Contribution streak computation: MEDIUM — Algorithm is straightforward from confirmed schema fields; year-boundary behavior is a known limitation

**Research date:** 2026-03-17
**Valid until:** 2026-06-17 (stable APIs; GitHub GraphQL schema changes infrequently; Actions workflow syntax is stable)
