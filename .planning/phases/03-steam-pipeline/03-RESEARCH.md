# Phase 3: Steam Pipeline - Research

**Researched:** 2026-03-17
**Domain:** Steam Web API, GitHub Actions cron workflow, React gaming section UI
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Game card layout
- Single horizontal row with horizontal scroll (consistent with Spotify's track row in Phase 4)
- Each card shows: wide capsule art filling the top of the card, game name, and hours in monospace format ("1,234 hours played")
- No rank numbers — hours descending order is self-evident
- All cards are clickable and open `store.steampowered.com/app/{appid}` in a new tab
- Section header label: **GAMES**

#### "PLAYING NOW" treatment
- "PLAYING NOW" badge overlaid on the top-left of the capsule art image
- Badge has an animated green pulse dot (●) using CSS animation — signals live/real-time data
- Active card gets a subtle green (#00ff00) box-shadow border glow — noticeable but not distracting
- When no game is currently playing, the top 5 render normally with no status indicator

#### Currently playing card (not in top 5)
- When the active game is not in the top 5, it appears in its own row above the top 5 row
- Same card style as top 5 cards — capsule art + PLAYING NOW badge + glow
- No explicit divider label between the active card and the top 5 row — the badge communicates it
- Always shows hours played even if the count is very low (e.g., "2 hours played")
- Clickable to the Steam store page, same as top 5 cards

### Claude's Discretion
- Cron schedule frequency (goal mentions ~10 minutes)
- Steam API key secret name in GitHub Actions
- Fetch script error handling and steam_ok flag logic
- Exact CSS animation keyframes for the pulse dot
- Card width/height proportions for the capsule art aspect ratio

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GAME-01 | User sees top 5 most played Steam games sorted by total hours descending, each showing Steam capsule (wide rectangular) art and hours in "1,234 hours played" format with monospace font | Steam API `GetOwnedGames` endpoint returns `playtime_forever` in minutes; CDN URL pattern `https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg` provides wide art; `Intl.NumberFormat` formats hours |
| GAME-02 | If the currently playing game is in the top 5, that game card shows a green pulse glow and "PLAYING NOW" badge | `GetPlayerSummaries` returns `gameid` (string) when in-game; compare to `appid` (number) in top_games — requires string/int coercion; CSS keyframe animation for pulse dot |
| GAME-03 | If the currently playing game is NOT in the top 5, it is shown separately above the top 5 list with the same green pulse glow and "PLAYING NOW" treatment | Same `gameid` detection logic; fetch game details for the active appid using `GetOwnedGames` (it will be in the owned list even if outside top 5) or keep `currently_playing` pre-populated in the fetch script |
</phase_requirements>

---

## Summary

Phase 3 requires two distinct deliverables: (1) a `scripts/fetch-steam-data.js` Node.js script that calls the Steam Web API and populates the `steam` section of `public/data.json`, and (2) a `GamingSection` React component that renders the fetched data. The existing `refresh-data.yml` GitHub Actions workflow and the data contract in `src/types/data.ts` are already wired — Phase 3 slots into both without schema changes.

The Steam Web API has three relevant endpoints. `IPlayerService/GetOwnedGames` (with `include_appinfo=1`) returns all owned games with total playtime — sort descending, take 5. `IPlayerService/GetRecentlyPlayedGames` is NOT suitable as a "currently playing" signal because it covers the last two weeks. `ISteamUser/GetPlayerSummaries` returns `gameid` (string app ID) and `gameextrainfo` (game title) when the player is actively in-game right now — this is the correct currently-playing source. Wide capsule art is served by Steam's CDN at `https://cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg` — no API call needed, pure URL construction.

The `[skip ci]` tag in the commit message prevents the `deploy.yml` push-triggered workflow from firing when the refresh script commits `data.json`. This already works in the Phase 2 workflow skeleton. Critically, `[skip ci]` does NOT prevent `schedule`-based workflows — so the cron refresh loop is safe.

**Primary recommendation:** Write `fetch-steam-data.js` as a standalone script (parallel to `fetch-github-data.js`), update `refresh-data.yml` to call it with `STEAM_API_KEY` and `STEAM_ID` secrets, and build `GamingSection.tsx` following the exact patterns of `ProjectsSection.tsx`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fetch` | Node 20 (native) | HTTP calls to Steam Web API | Already used in `fetch-github-data.js`; no extra deps |
| React 18 | ^18.3.1 (installed) | GamingSection component | Project standard |
| Tailwind CSS v4 | ^4.0.0 (installed) | Layout, spacing, text styles | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Intl.NumberFormat` | Native JS | Format `1,234 hours played` | No library needed — `new Intl.NumberFormat().format(n)` |
| CSS `@keyframes` | Native CSS | Pulse dot animation | Defined in `index.css` alongside existing vars |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native `fetch` | `node-fetch`, `axios` | No benefit — Node 20 native fetch is identical and avoids new dep |
| `header.jpg` CDN URL | `img_icon_url` from API | `img_icon_url` is a tiny 32x32 icon hash — completely wrong for card art |
| `GetPlayerSummaries` for currently-playing | `GetRecentlyPlayedGames` | `GetRecentlyPlayedGames` shows last 2 weeks, not live now; wrong signal |

**Installation:**
```bash
# No new npm packages needed — all required capabilities exist in the project
```

---

## Architecture Patterns

### Recommended Project Structure
```
scripts/
├── fetch-github-data.js    # exists (Phase 2)
└── fetch-steam-data.js     # NEW — Steam fetch script (parallel structure)

src/components/
├── ProjectsSection.tsx     # exists — reference pattern for GamingSection
├── GitHubStatsSection.tsx  # exists
└── GamingSection.tsx       # NEW — horizontal scroll row of game cards

src/types/
└── data.ts                 # exists — SteamGame, SteamData types already defined

.github/workflows/
└── refresh-data.yml        # exists — add Steam fetch step
```

### Pattern 1: Parallel Fetch Script (follows `fetch-github-data.js` style)

**What:** A standalone ESM Node script that fetches Steam data, merges it into the existing `data.json`, and writes back.
**When to use:** All pipeline scripts follow this pattern — called sequentially from `refresh-data.yml`.

The key architectural choice: the Steam script reads the current `data.json`, updates `steam` and `steam_ok` fields, then writes the file back. This preserves GitHub and Spotify data written by other steps, rather than overwriting the whole file.

```javascript
// Source: mirrors scripts/fetch-github-data.js pattern
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.join(__dirname, '..', 'public', 'data.json')

const STEAM_API_KEY = process.env.STEAM_API_KEY
const STEAM_ID = process.env.STEAM_ID

// Read existing data.json, update steam section, write back
const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'))
// ... fetch, update existing.steam and existing.steam_ok
fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2))
```

### Pattern 2: Steam API Calls — Three endpoints, two requests

**What:** `GetOwnedGames` for top 5 + `GetPlayerSummaries` for currently playing. Two requests total per refresh cycle.

```javascript
// GetOwnedGames — returns all owned games with playtime
// Source: https://partner.steamgames.com/doc/webapi/iplayerservice
const ownedUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/` +
  `?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&format=json`

// GetPlayerSummaries — returns gameid/gameextrainfo if currently in-game
// Source: https://wiki.teamfortress.com/wiki/WebAPI/GetPlayerSummaries
const summaryUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/` +
  `?key=${STEAM_API_KEY}&steamids=${STEAM_ID}&format=json`
```

**Response shape — owned games:**
```javascript
// response.response.games = array of { appid, name, playtime_forever, img_icon_url, ... }
// playtime_forever is in MINUTES — divide by 60 to get hours for display
// Sort by playtime_forever descending, take first 5
```

**Response shape — currently playing:**
```javascript
// response.response.players[0].gameid  (string, e.g. "730") — present ONLY when in-game
// response.response.players[0].gameextrainfo  (string, game name) — present ONLY when in-game
// IMPORTANT: gameid is a string; SteamGame.appid is a number — compare with parseInt(gameid)
```

### Pattern 3: Wide Capsule Art URL

**What:** Steam CDN serves game art directly by appid — no API call needed.

```javascript
// Source: verified from Steam CDN behavior, multiple community sources
// header.jpg is the 460x215 wide header — correct aspect ratio for horizontal cards
const capsuleUrl = `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`

// Alternative CDN (fallback, same content):
// https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg
```

The `img_icon_url` field from `GetOwnedGames` is a hash for the 32×32 icon — do NOT use it for card art. Always construct the CDN URL from appid.

### Pattern 4: GamingSection Component (follows ProjectsSection.tsx)

**What:** A section component that receives `SteamData` and `steam_ok` props, renders two conditional rows.

```typescript
// Source: follows pattern from src/components/ProjectsSection.tsx
interface GamingSectionProps {
  steamData: SteamData
  steamOk: boolean
}

export function GamingSection({ steamData, steamOk }: GamingSectionProps) {
  // Render: section > h2 "GAMES" > optional currently-playing row > top-5 scroll row
}
```

**App.tsx integration** — replace the Phase 2 placeholder:
```typescript
// Replace the existing placeholder block in App.tsx:
// {!data.steam_ok && <section>Gaming stats unavailable</section>}
// With:
<GamingSection steamData={data.steam} steamOk={data.steam_ok} />
```

### Pattern 5: PLAYING NOW Badge with Pulse Animation

**What:** Absolute-positioned overlay on the card image, animated dot via CSS keyframes.

```css
/* Add to src/index.css — follows existing CSS var pattern */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(0.7); }
}

.pulse-dot {
  animation: pulse-dot 1.2s ease-in-out infinite;
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--color-accent); /* #00ff00 */
}
```

```typescript
// Badge markup — absolute positioned over top-left of capsule art
<div style={{ position: 'relative' }}>
  <img src={capsuleUrl} alt={game.name} />
  {isPlaying && (
    <div style={{
      position: 'absolute', top: 8, left: 8,
      display: 'flex', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(0,0,0,0.75)',
      padding: '2px 6px',
      borderRadius: 4,
    }}>
      <span className="pulse-dot" />
      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}>
        PLAYING NOW
      </span>
    </div>
  )}
</div>
```

### Pattern 6: Hours Format

```typescript
// playtime_forever from Steam API is in MINUTES
// data.ts SteamGame.playtime_forever stores minutes — convert at display time
const hours = Math.floor(game.playtime_forever / 60)
const formatted = new Intl.NumberFormat('en-US').format(hours)
// e.g., "1,234 hours played"
const display = `${formatted} hours played`
```

### Anti-Patterns to Avoid

- **Using `img_icon_url` as card art:** It is a hash string for `cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/{appid}/{hash}.jpg` — a 32×32 icon. Always construct `header.jpg` from appid for card display.
- **Using `GetRecentlyPlayedGames` for currently-playing:** This covers the last 2 weeks, not live. Use `GetPlayerSummaries` + `gameid` field.
- **Comparing `gameid` (string) to `appid` (number) without coercion:** `gameid === appid` will always be false. Use `parseInt(gameid, 10) === appid`.
- **Overwriting entire `data.json` from the Steam script:** The Steam script runs after the GitHub script in the same workflow. Read the existing file, patch the steam fields, write back.
- **Relying on `[skip ci]` to stop the cron job:** `[skip ci]` only stops `push`-triggered workflows. The cron schedule runs unconditionally — this is correct behavior.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Number formatting | Custom comma formatter | `Intl.NumberFormat` (native JS) | Handles locale, edge cases, all integers |
| CSS animation | JS setInterval opacity toggling | CSS `@keyframes` + `animation` property | GPU-composited, zero JS, pause-on-hide free |
| Capsule art hosting | Proxy or cache Steam images | Direct CDN URL from Steam | Steam CDN is globally distributed, no storage cost, URLs are permanent by appid |
| Relative time display | Custom date math | `Intl.RelativeTimeFormat` (already used in Footer) | Same pattern already established in Phase 2 |

**Key insight:** Steam's CDN is public and permanent — `header.jpg` URLs by appid require no authentication and have been stable for years. Never proxy or cache these images.

---

## Common Pitfalls

### Pitfall 1: Steam Profile Privacy Blocks API Response

**What goes wrong:** `GetOwnedGames` and `GetPlayerSummaries` return empty or truncated data even with a valid API key.
**Why it happens:** Steam profile privacy settings "Game details" must be set to "Public". This is a per-account setting independent of the API key.
**How to avoid:** Confirm Steam ID 76561198275331284's profile is set to "Public > Game details" before testing. This is noted as a Phase 3 prerequisite in STATE.md.
**Warning signs:** `response.response.games` is undefined or empty array despite valid API key and steamid.

### Pitfall 2: `gameid` Type Mismatch for Currently Playing Detection

**What goes wrong:** Currently playing game never matches the top 5, even when it should.
**Why it happens:** `GetPlayerSummaries.gameid` is a **string** (e.g., `"730"`). `SteamGame.appid` is a **number** (e.g., `730`). Strict equality `===` always returns false.
**How to avoid:** In the fetch script, when building `currently_playing`, set `appid` to `parseInt(player.gameid, 10)`.
**Warning signs:** PLAYING NOW badge never appears even when actively in-game.

### Pitfall 3: Cron Schedule May Not Run At Exactly 10 Minutes

**What goes wrong:** GitHub Actions cron schedules are best-effort and can have 5–30 minute delays during high load periods.
**Why it happens:** GitHub's scheduler is shared infrastructure; precise timing is not guaranteed.
**How to avoid:** This is expected behavior — document in the section header as "updates every ~10 minutes". Do not build retry or real-time polling logic.
**Warning signs:** N/A — this is inherent to the platform, not a bug.

### Pitfall 4: `playtime_forever` is Minutes, Not Hours

**What goes wrong:** "1 hours played" when the game has 60 hours.
**Why it happens:** Steam API's `playtime_forever` is always in **minutes**. The data contract `SteamGame.playtime_forever` stores minutes as-is (correct).
**How to avoid:** Always `Math.floor(playtime_forever / 60)` before display. Never store hours in `data.json` — store raw minutes, convert at render time.
**Warning signs:** Hours displayed are ~60x too large or too small.

### Pitfall 5: Infinite Deploy Loop

**What goes wrong:** The refresh commit triggers `deploy.yml`, which rebuilds the site on every data refresh.
**Why it happens:** `deploy.yml` triggers on `push` to `main`. The refresh script commits to `main`.
**How to avoid:** The `[skip ci]` tag in the commit message (`chore: refresh data [skip ci]`) prevents push-triggered workflows. This is already implemented in the Phase 2 `refresh-data.yml`. Do not remove it.
**Warning signs:** GitHub Actions shows a deploy run starting every ~10 minutes.

### Pitfall 6: Steam Script Fails, GitHub Data Wiped

**What goes wrong:** Steam fetch fails (network error, bad key), script exits with error, `data.json` is left in a broken or partial state.
**Why it happens:** If the script writes data.json before all fetches complete (or writes an empty steam block on error), the file is corrupted.
**How to avoid:** Use try/catch around Steam API calls. On failure, write `steam_ok: false` with the **existing** `steam` data preserved. Never write partial data.
**Warning signs:** `steam_ok` is false in production unexpectedly.

---

## Code Examples

### fetch-steam-data.js — Full Structure

```javascript
// scripts/fetch-steam-data.js
// Source: modeled on scripts/fetch-github-data.js (Phase 2)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.join(__dirname, '..', 'public', 'data.json')

const STEAM_API_KEY = process.env.STEAM_API_KEY
const STEAM_ID = process.env.STEAM_ID

if (!STEAM_API_KEY) { console.error('STEAM_API_KEY required'); process.exit(1) }
if (!STEAM_ID) { console.error('STEAM_ID required'); process.exit(1) }

async function main() {
  const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'))

  try {
    // Fetch 1: owned games for top 5
    const ownedRes = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/` +
      `?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&format=json`
    )
    if (!ownedRes.ok) throw new Error(`GetOwnedGames HTTP ${ownedRes.status}`)
    const ownedJson = await ownedRes.json()
    const allGames = ownedJson.response?.games ?? []

    // Top 5 sorted by total playtime descending
    const topGames = [...allGames]
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, 5)
      .map(g => ({ appid: g.appid, name: g.name, playtime_forever: g.playtime_forever, img_icon_url: g.img_icon_url }))

    // Fetch 2: currently playing via player summaries
    const summaryRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/` +
      `?key=${STEAM_API_KEY}&steamids=${STEAM_ID}&format=json`
    )
    if (!summaryRes.ok) throw new Error(`GetPlayerSummaries HTTP ${summaryRes.status}`)
    const summaryJson = await summaryRes.json()
    const player = summaryJson.response?.players?.[0]

    let currentlyPlaying = null
    if (player?.gameid) {
      const activeAppId = parseInt(player.gameid, 10)
      // Find in owned games to get playtime_forever
      const activeGame = allGames.find(g => g.appid === activeAppId)
      currentlyPlaying = {
        appid: activeAppId,
        name: player.gameextrainfo ?? activeGame?.name ?? 'Unknown',
        playtime_forever: activeGame?.playtime_forever ?? 0,
        img_icon_url: activeGame?.img_icon_url ?? '',
      }
    }

    existing.steam = { top_games: topGames, currently_playing: currentlyPlaying }
    existing.steam_ok = true
  } catch (err) {
    console.error('Steam fetch failed:', err.message)
    existing.steam_ok = false
    // Preserve existing steam data on failure
  }

  existing.updated_at = new Date().toISOString()
  fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2))
  console.log('data.json updated with steam data')
}

main()
```

### refresh-data.yml — Updated Steps

```yaml
# .github/workflows/refresh-data.yml — add after existing Fetch GitHub data step
- name: Fetch Steam data
  run: node scripts/fetch-steam-data.js
  env:
    STEAM_API_KEY: ${{ secrets.STEAM_API_KEY }}
    STEAM_ID: ${{ secrets.STEAM_ID }}
```

Note: the existing `Commit updated data.json` step already handles both scripts' output since it commits `public/data.json` once at the end. No change needed to the commit step.

### GamingSection.tsx — Component Structure

```typescript
// src/components/GamingSection.tsx
import type { SteamData, SteamGame } from '../types/data'

interface GamingSectionProps {
  steamData: SteamData
  steamOk: boolean
}

function capsuleUrl(appid: number): string {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`
}

function formatHours(playtimeMinutes: number): string {
  const hours = Math.floor(playtimeMinutes / 60)
  return `${new Intl.NumberFormat('en-US').format(hours)} hours played`
}

export function GamingSection({ steamData, steamOk }: GamingSectionProps) {
  if (!steamOk || steamData.top_games.length === 0) {
    return (
      <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <h2 className="text-sm font-medium mb-4 opacity-50" style={{ color: 'var(--color-text)' }}>GAMES</h2>
        <p className="text-sm opacity-40" style={{ color: 'var(--color-text)' }}>Gaming stats unavailable</p>
      </section>
    )
  }

  const { top_games, currently_playing } = steamData
  const currentlyPlayingAppId = currently_playing?.appid ?? null
  const isCurrentInTop5 = top_games.some(g => g.appid === currentlyPlayingAppId)

  return (
    <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <h2 className="text-sm font-medium mb-4 opacity-50" style={{ color: 'var(--color-text)' }}>GAMES</h2>

      {/* Currently playing row — only when active game is NOT in top 5 */}
      {currently_playing && !isCurrentInTop5 && (
        <div className="flex gap-3 overflow-x-auto pb-3 mb-4">
          <GameCard game={currently_playing} isPlaying={true} />
        </div>
      )}

      {/* Top 5 row */}
      <div className="flex gap-3 overflow-x-auto pb-3">
        {top_games.map(game => (
          <GameCard
            key={game.appid}
            game={game}
            isPlaying={game.appid === currentlyPlayingAppId}
          />
        ))}
      </div>
    </section>
  )
}
```

### GameCard Sub-component

```typescript
function GameCard({ game, isPlaying }: { game: SteamGame; isPlaying: boolean }) {
  return (
    <a
      href={`https://store.steampowered.com/app/${game.appid}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        flexShrink: 0,
        width: 184,                         // capsule art native ratio ~2.15:1
        textDecoration: 'none',
        color: 'inherit',
        border: `1px solid ${isPlaying ? 'var(--color-accent)' : 'var(--color-divider)'}`,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: isPlaying ? '0 0 12px rgba(0,255,0,0.3)' : 'none',
      }}
    >
      {/* Capsule art with optional PLAYING NOW badge */}
      <div style={{ position: 'relative' }}>
        <img
          src={capsuleUrl(game.appid)}
          alt={game.name}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
        {isPlaying && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            display: 'flex', alignItems: 'center', gap: 4,
            backgroundColor: 'rgba(0,0,0,0.75)',
            padding: '2px 6px', borderRadius: 3,
          }}>
            <span className="pulse-dot" />
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-accent)',
              letterSpacing: '0.05em',
            }}>
              PLAYING NOW
            </span>
          </div>
        )}
      </div>

      {/* Game name and hours */}
      <div style={{ padding: '6px 8px', backgroundColor: 'var(--color-bg)' }}>
        <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 2, color: 'var(--color-text)' }}>
          {game.name}
        </p>
        <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', opacity: 0.6, color: 'var(--color-text)' }}>
          {formatHours(game.playtime_forever)}
        </p>
      </div>
    </a>
  )
}
```

### CSS for Pulse Dot (add to index.css)

```css
/* Add to src/index.css after :root block */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.35; transform: scale(0.65); }
}

.pulse-dot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: var(--color-accent);
  animation: pulse-dot 1.4s ease-in-out infinite;
  flex-shrink: 0;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `steamcdn-a.akamaihd.net` CDN domain | `cdn.cloudflare.steamstatic.com` | ~2021 | Cloudflare CDN is now primary; Akamai domain still works as fallback |
| `http://` Steam API URLs | `https://api.steampowered.com` | ~2016 | HTTPS only; old HTTP redirects |
| `GetPlayerSummaries/v0001` | `v0002` | ~2013 | v2 returns array under `response.players`; v1 is obsolete |

**Deprecated/outdated:**
- `img_icon_url` for card display: The field exists but is a 32×32 icon hash. `header.jpg` via CDN URL construction is correct for card art.
- The `SteamGame.img_icon_url` field in `data.ts` is stored but should never be rendered as card art — it exists for potential future icon use only.

---

## Open Questions

1. **`data.ts` schema — does `SteamGame` need `playtime_2weeks` field?**
   - What we know: `GetOwnedGames` returns `playtime_2weeks` alongside `playtime_forever`
   - What's unclear: Phase 5 hover states may want recent activity; Phase 3 only needs total hours
   - Recommendation: Omit from `data.ts` for now. Phase 5 can extend the type if needed.

2. **Steam cron schedule frequency**
   - What we know: Existing `refresh-data.yml` already has `*/10 * * * *` (every 10 minutes)
   - What's unclear: GitHub Actions scheduler has known delays under load — actual cadence may be 10–40 minutes
   - Recommendation: Keep `*/10 * * * *`. The goal states "~10 minutes". No change needed.

3. **Secret naming convention in GitHub Actions**
   - What we know: Phase 2 uses `GH_PAT` and `GH_LOGIN`; naming is user-controlled
   - What's unclear: User has not set Steam secrets yet; they need to be created in repo Settings > Secrets
   - Recommendation: Use `STEAM_API_KEY` (the API key) and `STEAM_ID` (the numeric Steam ID `76561198275331284`). Document this in the plan as a prereq action.

4. **What happens when `top_games` contains fewer than 5 games?**
   - What we know: Most Steam users have far more than 5 games; unlikely edge case
   - What's unclear: First test run may show 0 if privacy is not yet set to public
   - Recommendation: Render however many games exist (1–5). The fallback shows "Gaming stats unavailable" only when `steam_ok: false`.

---

## Sources

### Primary (HIGH confidence)
- [IPlayerService — Steamworks Docs](https://partner.steamgames.com/doc/webapi/iplayerservice) — GetOwnedGames and GetRecentlyPlayedGames parameters verified
- [GetPlayerSummaries — TF2 Wiki (official Valve wiki)](https://wiki.teamfortress.com/wiki/WebAPI/GetPlayerSummaries) — `gameid` and `gameextrainfo` field names confirmed
- [GitHub Docs — Skipping workflow runs](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-workflow-runs/skipping-workflow-runs) — `[skip ci]` applies only to push/pull_request, NOT schedule events
- Existing project files: `src/types/data.ts`, `scripts/fetch-github-data.js`, `src/index.css`, `src/App.tsx` — read directly

### Secondary (MEDIUM confidence)
- Steam CDN URL pattern `cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg` — confirmed via multiple community sources and Steam CDN behavior documentation
- Steam API rate limits: 100,000 calls/day official, ~200 req/5 min burst — from Steam Web API Terms of Use and community reports

### Tertiary (LOW confidence)
- Exact CDN failover behavior between `cdn.cloudflare.steamstatic.com` and `cdn.akamai.steamstatic.com` — community observation only, no official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed in project; Steam API endpoints verified via official docs
- Architecture: HIGH — fetch script pattern directly mirrors existing `fetch-github-data.js`; types already defined in `data.ts`
- Pitfalls: HIGH — privacy requirement, type mismatch, and infinite deploy loop all verified from official sources and existing code

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (Steam API endpoints are stable; CDN URLs have been stable for years)
