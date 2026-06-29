# Phase 4: Spotify Integration - Research

**Researched:** 2026-03-18
**Domain:** Spotify Web API (OAuth refresh token flow) + React horizontal scroll UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Track card details**
- Show only: square album art + track name + artist name (nothing else)
- Truncate long track names and artist names with ellipsis — no wrapping, no marquee
- Subtle lift/shadow hover effect (consistent with GameCard from Phase 3)
- Album art size matches Steam game art size from Phase 3 for visual consistency

**Scroll interaction**
- Snap-scroll per card (scroll lands cleanly on card boundaries)
- No prev/next arrow buttons — scroll only
- Hide browser scrollbar (overflow still scrollable)
- Show partial "peek" of next card (~20–30px) at the row edge to signal more content

**Fallback / error state**
- Show a simple text message when spotify_ok is false or tracks array is empty
- Neutral/informational tone: e.g. "Music data is currently unavailable"
- Section collapses to minimal height — no wasted space, just the message

**Section framing**
- Section heading: "Recently Played"
- Small Spotify logo/icon placed next to the heading (source attribution)
- Matches Gaming section structure exactly — same heading level, container width, spacing

### Claude's Discretion
- Exact fallback message copy (within neutral/informational tone)
- Card gap and padding values
- Exact peek width (around 20–30px)
- How to render the Spotify logo (SVG inline, img tag, or icon library)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MUSC-01 | User sees last 5 Spotify-listened tracks displayed as a horizontal scrollable row with square album art, track name, and artist name below each | Spotify `/v1/me/player/recently-played?limit=5` returns track objects with `album.images`, `name`, `artists[0].name`. CSS scroll-snap + flexbox handles horizontal layout. |
| MUSC-02 | Each track is clickable and opens the Spotify track URL in a new tab | Track objects include `external_urls.spotify`. Render as `<a href target="_blank" rel="noopener noreferrer">`. |
| MUSC-03 | If Spotify data is unavailable or the track array is empty, a graceful fallback state is shown instead of a blank section | `spotify_ok` flag already in data.json schema. Check `!spotifyOk || tracks.length === 0` in MusicSection component, mirrors GamingSection pattern. |
</phase_requirements>

---

## Summary

Phase 4 has two distinct parts: a **pipeline script** (`scripts/fetch-spotify-data.js`) that exchanges a stored refresh token for a short-lived access token and then calls Spotify's recently-played endpoint, and a **UI component** (`MusicSection.tsx`) that renders the fetched tracks as a horizontal snap-scroll row.

The pipeline follows the same read-patch-write pattern established in Phase 3 (Steam). The Spotify Authorization Code Flow is the correct choice for server-side use: client credentials are safely stored as GitHub secrets, a one-time manual OAuth flow yields a long-lived refresh token, and every subsequent pipeline run exchanges that refresh token for a fresh access token without user interaction. The refresh token itself may rotate (Spotify may return a new one in the token response), so the script must handle that case.

The UI component mirrors GamingSection.tsx structure exactly. CSS scroll-snap (no JS library needed) handles per-card snapping. The scrollbar is hidden via CSS pseudo-selectors while keeping scroll functional. The peek effect is achieved with `paddingRight` on the scroll container and `flexShrink: 0` on cards. `react-icons` is already installed — `FaSpotify` from `react-icons/fa` provides the logo icon at no extra cost, matching the Footer pattern.

**Primary recommendation:** Build the pipeline as a pure Node.js ESM script using native `fetch` (Node 18+), following the fetch-steam-data.js pattern. Render the UI with inline styles and CSS scroll-snap — no new dependencies needed.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js native `fetch` | Node 20 (already pinned) | HTTP calls to Spotify API token + recently-played endpoints | Already used in Steam/GitHub scripts; no extra deps |
| `node:fs` + `node:path` | built-in | Read/write `public/data.json` | Pattern established in fetch-steam-data.js |
| `react-icons/fa` (`FaSpotify`) | ^5.6.0 (already installed) | Spotify attribution icon in section heading | Already in package.json; Footer uses `FaGithub`, `FaLinkedin`, `FaSteam` — same package |
| CSS scroll-snap (browser native) | All modern browsers | Per-card snap scrolling on horizontal overflow row | No JS library needed; w3c-standard, wide support |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `Buffer` (Node built-in) | Node 20 | Base64-encode `client_id:client_secret` for Authorization header | Required for Spotify token endpoint Basic auth |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native fetch + manual token exchange | `spotify-web-api-node` npm package | Package adds ~100KB, is community-maintained (not official), and adds a dependency for a task that is ~30 lines of native fetch code. Not worth it. |
| `react-icons/fa FaSpotify` | Inline SVG from Spotify branding page | Both work; react-icons is already in the project and follows the Footer pattern. SVG inline avoids any licensing edge cases but is more verbose. |
| CSS scroll-snap | `embla-carousel` or `keen-slider` | JS carousel libraries add dependencies and JS overhead. CSS scroll-snap handles the simple horizontal snap requirement with zero JS. |

**Installation:**
```bash
# No new npm packages needed — all requirements met by existing stack
```

---

## Architecture Patterns

### Recommended Project Structure

```
scripts/
└── fetch-spotify-data.js     # New: pipeline script (mirrors fetch-steam-data.js)

src/
└── components/
    └── MusicSection.tsx       # New: UI component (mirrors GamingSection.tsx)

.planning/phases/04-spotify-integration/
└── RUNBOOK-spotify-token.md   # One-time token setup instructions (Wave 0 doc)
```

### Pattern 1: Pipeline — Read-Patch-Write

**What:** Read existing `data.json`, fetch Spotify data, patch `spotify` and `spotify_ok` fields only, write back. Never overwrite fields written by other scripts.

**When to use:** Always. This is the established contract from fetch-steam-data.js and fetch-github-data.js.

**Example:**
```javascript
// Source: mirrors scripts/fetch-steam-data.js pattern
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.join(__dirname, '..', 'public', 'data.json')

async function main() {
  const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'))

  try {
    // 1. Exchange refresh token for access token
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
      }),
    })
    if (!tokenRes.ok) throw new Error(`Token exchange HTTP ${tokenRes.status}`)
    const tokenJson = await tokenRes.json()
    const accessToken = tokenJson.access_token
    // Spotify may rotate the refresh token — handle it
    // (log the new token; rotation is rare but documented)

    // 2. Fetch recently played, limit 5
    const recentRes = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=5',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!recentRes.ok) throw new Error(`Recently played HTTP ${recentRes.status}`)
    const recentJson = await recentRes.json()

    // 3. Map to SpotifyTrack schema (from src/types/data.ts)
    const recentTracks = (recentJson.items ?? []).map(item => ({
      name: item.track.name,
      artist: item.track.artists[0]?.name ?? 'Unknown',
      album_art: item.track.album.images[0]?.url ?? null,
      spotify_url: item.track.external_urls.spotify,
    }))

    existing.spotify = { recent_tracks: recentTracks, currently_playing: null }
    existing.spotify_ok = true
  } catch (err) {
    console.error('Spotify fetch failed:', err.message)
    existing.spotify_ok = false
    // Preserve existing spotify data (last good state) — same as Steam pattern
  }

  existing.updated_at = new Date().toISOString()
  fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2))
}

main()
```

### Pattern 2: MusicSection — Mirror GamingSection Structure

**What:** Stateless component receiving `spotifyData` and `spotifyOk` props. Renders fallback when `!spotifyOk || tracks.length === 0`. Inner `TrackCard` sub-component is an `<a>` tag (MUSC-02).

**When to use:** Always match GamingSection structure for visual consistency.

**Example:**
```typescript
// Source: mirrors src/components/GamingSection.tsx pattern
import { FaSpotify } from 'react-icons/fa'
import type { SpotifyData } from '../types/data'

interface MusicSectionProps {
  spotifyData: SpotifyData
  spotifyOk: boolean
}

export function MusicSection({ spotifyData, spotifyOk }: MusicSectionProps) {
  if (!spotifyOk || spotifyData.recent_tracks.length === 0) {
    return (
      <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <h2 className="text-sm font-medium mb-4 opacity-50" style={{ color: 'var(--color-text)' }}>
          RECENTLY PLAYED
        </h2>
        <p className="text-sm opacity-40" style={{ color: 'var(--color-text)' }}>
          Music data is currently unavailable
        </p>
      </section>
    )
  }
  // ...scroll row rendering
}
```

### Pattern 3: CSS Scroll-Snap with Hidden Scrollbar and Peek

**What:** Container gets `overflowX: 'auto'`, `scrollSnapType: 'x mandatory'`, `paddingRight: '24px'` (peek). Scrollbar hidden via CSS class. Cards get `scrollSnapAlign: 'start'`, `flexShrink: 0`.

**When to use:** All horizontal scroll rows that need per-card snap.

**Example:**
```typescript
// Container
<div
  style={{
    display: 'flex',
    gap: 12,
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    overscrollBehaviorX: 'contain',
    paddingBottom: 8,
    paddingRight: 24,   // "peek" — partial next card visible at right edge
  }}
  className="hide-scrollbar"
>
  {/* Cards */}
</div>
```

```css
/* In index.css — mirrors pulse-dot pattern (CSS class for browser compat) */
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

```typescript
// Card wrapper (each TrackCard <a> tag)
style={{
  flexShrink: 0,
  scrollSnapAlign: 'start',
  width: '120px',   // square album art — matches GameCard width visually
  // ...
}}
```

### Pattern 4: GitHub Actions Workflow Step Addition

**What:** Add a new `Fetch Spotify data` step to `refresh-data.yml` between the Steam step and the commit step. Pass `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` from GitHub Secrets.

**Example:**
```yaml
- name: Fetch Spotify data
  run: node scripts/fetch-spotify-data.js
  env:
    SPOTIFY_CLIENT_ID: ${{ secrets.SPOTIFY_CLIENT_ID }}
    SPOTIFY_CLIENT_SECRET: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    SPOTIFY_REFRESH_TOKEN: ${{ secrets.SPOTIFY_REFRESH_TOKEN }}
```

### Anti-Patterns to Avoid

- **Overwriting full data.json:** The script must use read-patch-write. The commit step in refresh-data.yml uses `git add public/data.json` — all three scripts write to the same file sequentially.
- **Storing refresh token in data.json:** It goes in GitHub Secrets only, never in the committed file.
- **Using `overflow: hidden` to hide scrollbar:** This disables scrolling. Use the `::-webkit-scrollbar` + `scrollbar-width: none` approach.
- **Dynamic Tailwind classes for scroll-snap:** camelCase inline styles work; Tailwind utility classes for scroll-snap are available in Tailwind v4 but inline styles are consistent with how GamingSection handles layout.
- **Fetching more than 5 tracks and slicing in JS:** Pass `?limit=5` directly to the API to minimize data transfer.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Base64 encoding of `client_id:client_secret` | Custom base64 util | `Buffer.from(...).toString('base64')` (Node built-in) | Always available in Node 20; zero deps |
| Scroll snap with JS | `scrollTo()` listeners, IntersectionObserver carousel | CSS `scroll-snap-type` + `scroll-snap-align` | Browser-native, works on touch too; no JS event handlers needed |
| Hiding scrollbar per-browser | Feature detection JS | CSS class with three browser vendor rules (`::-webkit-scrollbar`, `-ms-overflow-style`, `scrollbar-width`) | Three-line CSS class covers all modern browsers |
| OAuth flow automation | Any OAuth library | Manual fetch (30 lines) — the token exchange is a single POST | Library overhead not justified for one HTTP call |

**Key insight:** The entire OAuth token refresh is ~10 lines of native fetch. The scroll UI is ~5 lines of CSS. Resist the urge to reach for libraries.

---

## Common Pitfalls

### Pitfall 1: Refresh Token Rotation

**What goes wrong:** Spotify _may_ return a new `refresh_token` in the token refresh response. If the script ignores the new token, the old one eventually stops working.

**Why it happens:** Spotify's documentation states "When a refresh token is not returned, continue using the existing token" — implying it sometimes IS returned with a new value.

**How to avoid:** Always check `tokenJson.refresh_token`. For this project's architecture (static token in GitHub Secrets), log a warning if a new refresh token is returned, so the developer can update the secret manually. The pipeline won't auto-update secrets.

**Warning signs:** Intermittent `401` errors from the recently-played endpoint after weeks of successful runs.

### Pitfall 2: One-Time OAuth Setup Complexity

**What goes wrong:** The initial refresh token requires a browser-based OAuth flow that cannot be scripted. Forgetting to do this before planning tasks causes a blocker.

**Why it happens:** Spotify requires user consent in a browser for the `user-read-recently-played` scope — there is no "service account" approach.

**How to avoid:** The one-time setup must be done manually BEFORE any pipeline testing. A runbook document should be created in Wave 0 covering: (1) create Spotify app in Developer Dashboard, (2) set redirect URI to `http://127.0.0.1:3000/callback`, (3) run token-generator script to get `code`, (4) exchange `code` for `refresh_token`, (5) store in GitHub Secrets as `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`.

**Warning signs:** This is a known blocker — already documented in STATE.md `Pending Blockers`.

### Pitfall 3: Album Art URL — Use Largest Available Image

**What goes wrong:** `item.track.album.images` is an array sorted largest-to-smallest. Using `images[0]` gives the largest (640×640 typically). Using the wrong index gives a tiny thumbnail.

**Why it happens:** The API doesn't label images by role; order is the only signal.

**How to avoid:** Always use `images[0]?.url` for the highest-quality square art. Fall back to `null` (already handled by `SpotifyTrack.album_art: string | null` in types).

**Warning signs:** Blurry/pixelated album art in the rendered cards.

### Pitfall 4: `artists` is an Array

**What goes wrong:** A track can have multiple artists. Assuming `artists.name` (singular) throws a TypeError.

**Why it happens:** Spotify's track object always returns `artists` as an array.

**How to avoid:** Use `item.track.artists[0]?.name ?? 'Unknown'`. For this phase, showing only the primary artist matches the "track name + artist name" spec.

**Warning signs:** Runtime error "Cannot read properties of undefined (reading 'name')".

### Pitfall 5: App.tsx Spotify Placeholder Must Be Replaced

**What goes wrong:** App.tsx currently has a hardcoded `{!data.spotify_ok && ...}` placeholder that only shows when spotify_ok is false. This placeholder needs to be replaced (not just supplemented) by the MusicSection component, which handles its own fallback state.

**Why it happens:** Phase 3 left a placeholder comment: `{/* Spotify section placeholder — Phase 4 will replace this */}`.

**How to avoid:** When wiring MusicSection into App.tsx, delete the existing placeholder block entirely and replace with `<MusicSection spotifyData={data.spotify} spotifyOk={data.spotify_ok} />` — unconditional rendering, same as GamingSection.

---

## Code Examples

Verified patterns from official sources:

### Token Refresh Request (Authorization Code Flow)

```javascript
// Source: https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens
const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': 'Basic ' + Buffer.from(
      `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
    ).toString('base64'),
  },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: SPOTIFY_REFRESH_TOKEN,
  }),
})
const { access_token, refresh_token: newRefreshToken } = await tokenRes.json()
// newRefreshToken may be undefined if Spotify did not rotate — use existing
```

### Recently Played Request

```javascript
// Source: https://developer.spotify.com/documentation/web-api/reference/get-recently-played
const recentRes = await fetch(
  'https://api.spotify.com/v1/me/player/recently-played?limit=5',
  { headers: { Authorization: `Bearer ${access_token}` } }
)
const { items } = await recentRes.json()
// items[n].track.name, .artists[0].name, .album.images[0].url, .external_urls.spotify
```

### Initial OAuth Code Flow (One-Time Setup)

```
// Step 1: Open in browser (substitute real values):
// https://accounts.spotify.com/authorize
//   ?client_id=YOUR_CLIENT_ID
//   &response_type=code
//   &redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fcallback
//   &scope=user-read-recently-played
//   &state=some-random-string

// Step 2: After redirect, extract ?code= from URL

// Step 3: Exchange code for tokens (one-time POST):
// grant_type=authorization_code, code=CODE, redirect_uri=http://127.0.0.1:3000/callback
// Response includes refresh_token → store in GitHub Secrets
```

### CSS Hidden Scrollbar Class

```css
/* In src/index.css — mirrors pulse-dot pattern */
.hide-scrollbar::-webkit-scrollbar { display: none; }         /* Chrome/Safari */
.hide-scrollbar { -ms-overflow-style: none; }                  /* IE/Edge */
.hide-scrollbar { scrollbar-width: none; }                     /* Firefox */
```

### Scroll Container Inline Styles (React)

```typescript
// Horizontal snap container
{
  display: 'flex',
  gap: 12,
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  overscrollBehaviorX: 'contain',
  paddingRight: 24,   // peek at next card
  paddingBottom: 8,
}

// Each card (scrollSnapAlign on the card wrapper / <a> tag)
{
  scrollSnapAlign: 'start',
  flexShrink: 0,
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Implicit Grant Flow (token in URL hash, no refresh token) | Authorization Code Flow or PKCE | Spotify deprecated Implicit Grant ~2022 | Must use Authorization Code Flow for server-side; PKCE for browser-only |
| `spotify-web-api-node` (community npm package) | Native `fetch` with manual token exchange | Node 18 (2022) shipped fetch built-in | No wrapper library needed for simple token + one endpoint calls |
| `scroll-snap-points-x` (old prefixed CSS) | `scroll-snap-type: x mandatory` | CSS Scroll Snap Level 1 (W3C, ~2019, widely shipped by 2021) | Use unprefixed standard properties; all modern browsers support it |

**Deprecated/outdated:**
- Implicit Grant Flow: Removed from Spotify's recommended flows. Do not use.
- `available_markets` field on Spotify track/album objects: Deprecated in Spotify API (per their reference docs). Do not rely on it.

---

## Open Questions

1. **Refresh token rotation handling**
   - What we know: Spotify MAY return a new refresh_token in the token refresh response; if so, the old one may stop working
   - What's unclear: Whether Spotify currently rotates tokens by default for Authorization Code Flow, or only under certain conditions
   - Recommendation: Script should log a console warning if a new refresh token appears in the response. Developer can then manually update the GitHub Secret. This is acceptable for a personal portfolio.

2. **Album art aspect ratio**
   - What we know: Spotify `album.images[0]` is 640×640 for most releases (square). Some older releases may vary.
   - What's unclear: Whether any edge case produces non-square images
   - Recommendation: Render as a fixed-width square `<img>` with `objectFit: 'cover'` to handle any edge case without layout breaking.

3. **`currently_playing` field in `SpotifyData` type**
   - What we know: `src/types/data.ts` defines `SpotifyData.currently_playing: string | null` but Phase 4's spec does not include a "currently playing" indicator (that's a v2 UX-02 idea, deferred)
   - What's unclear: Whether the pipeline should populate this field at all
   - Recommendation: Set `currently_playing: null` in all pipeline writes for Phase 4. The field exists in the schema for future use; populating it is out of scope.

---

## Sources

### Primary (HIGH confidence)
- `https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens` — token refresh request format, headers, body, response fields
- `https://developer.spotify.com/documentation/web-api/reference/get-recently-played` — endpoint URL, scope, query parameters, response shape
- `https://developer.spotify.com/documentation/web-api/tutorials/code-flow` — initial authorization code flow, token exchange, refresh_token in response
- `https://developer.spotify.com/documentation/design` — Spotify icon usage guidelines, allowed colors, minimum sizes, attribution requirement
- `C:/Users/denys/Desktop/denys_tsinyk/src/types/data.ts` — confirmed `SpotifyTrack` and `SpotifyData` interfaces already defined
- `C:/Users/denys/Desktop/denys_tsinyk/src/components/GamingSection.tsx` — confirmed structural pattern (fallback branch, section heading, flex scroll row, sub-component)
- `C:/Users/denys/Desktop/denys_tsinyk/src/App.tsx` — confirmed placeholder block to replace, unconditional GamingSection rendering pattern
- `C:/Users/denys/Desktop/denys_tsinyk/package.json` — confirmed `react-icons ^5.6.0` installed; `FaSpotify` available
- `C:/Users/denys/Desktop/denys_tsinyk/.github/workflows/refresh-data.yml` — confirmed step insertion point, env var pattern, no `fetch-spotify-data.js` step yet
- `C:/Users/denys/Desktop/denys_tsinyk/src/index.css` — confirmed CSS class pattern for `.pulse-dot`; same approach for `.hide-scrollbar`
- `https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-type` — CSS scroll-snap-type property, browser support
- `https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-snap-align` — CSS scroll-snap-align property

### Secondary (MEDIUM confidence)
- `https://developer.spotify.com/documentation/web-api/concepts/authorization` — confirms Authorization Code Flow is recommended for server-side (client secret can be safely stored)
- WebSearch: Spotify token rotation behavior — confirmed by multiple community sources that `refresh_token` may be returned in token refresh response

### Tertiary (LOW confidence)
- WebSearch community sources on token generator scripts — useful for runbook, but specific implementations not authoritative

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against project's existing package.json; Spotify API endpoints verified against official docs
- Architecture: HIGH — patterns directly modeled on existing GamingSection.tsx and fetch-steam-data.js; no speculation
- Pitfalls: HIGH for token rotation and array access (verified in API docs); MEDIUM for album art dimension edge case (based on API docs but no exhaustive testing)

**Research date:** 2026-03-18
**Valid until:** 2026-06-18 (Spotify API is stable; CSS scroll-snap is W3C standard)
