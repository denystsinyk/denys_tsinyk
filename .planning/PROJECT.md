# Denys Tsinyk — Personal Website

## What This Is

A dark, minimal personal portfolio for Denys Tsinyk — a software engineer and CS student. The site is data-forward and brutalist: it pulls live data from Steam, Spotify, and GitHub to show what Denys is actually doing rather than just listing credentials. Hosted statically on GitHub Pages with a GitHub Actions cron job refreshing API data every ~10 minutes.

## Core Value

The site should feel like a live dashboard of Denys's real-world activity — not a resume, but a window into what he's building, playing, and listening to right now.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Professional section: 3 one-liner work experiences (no dates)
- [ ] Gaming section: top 5 most played Steam games with capsule art, hours, and currently-playing logic
- [ ] Music section: last 5 Spotify tracks as horizontal scrollable row with album art
- [ ] Projects section: pinned GitHub repos with stars and primary language badge
- [ ] GitHub stats: top languages bar + contribution streak
- [ ] Social links footer: GitHub, LinkedIn, Email, Steam profile
- [ ] GitHub Actions cron (~10min) fetches Steam + Spotify data and commits data.json
- [ ] Dark minimal design: #0a0a0a background, white text, green (#00ff00) accent for live states
- [ ] Monospace font for data values (hours, stats), clean sans-serif for everything else
- [ ] Smooth hover states on game covers (scale + glow)
- [ ] Green pulse glow + "PLAYING NOW" badge for currently playing Steam game

### Out of Scope

- Server-side rendering / API routes — GitHub Pages is static-only
- Discord presence — user did not select this
- Spotify live ticker — user did not select this
- Blog / writing section — not requested
- Mobile app — web only

## Context

- **Steam ID:** 76561198275331284
- **Hosting:** GitHub Pages (static)
- **Data refresh strategy:** GitHub Actions workflow runs on schedule, fetches Steam + Spotify via secrets stored in repo settings, writes `public/data.json`, auto-commits
- **Spotify auth:** Refresh token stored as GitHub Actions secret — workflow exchanges for access token each run
- **GitHub API:** Public, no auth needed for pinned repos + stats (rate limits are generous for cron use)
- **Social links:** GitHub, LinkedIn, Email, Steam — placeholders to be filled in env/config

## Constraints

- **Static hosting:** No server-side code — all dynamic data must come from pre-fetched `data.json` or public APIs callable client-side
- **Steam API:** Requires API key (secret) — must be fetched server-side (GitHub Actions), not client-side
- **Spotify API:** Requires refresh token (secret) — same: GitHub Actions only
- **GitHub Pages:** Needs `gh-pages` branch or `docs/` folder output from Vite build
- **Tech stack:** React + Vite (no Next.js — static export complexity not needed for this scope)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React + Vite over Next.js | Static site with no SSR needs; Vite is simpler for GH Pages deployment | — Pending |
| GitHub Actions for data fetching | Avoids exposing API keys client-side; works with static hosting | — Pending |
| data.json as data layer | Single file read on page load; simple, fast, no runtime API calls | — Pending |
| Green (#00ff00) accent | Matches terminal/gaming aesthetic; used only for live/active states | — Pending |

---
*Last updated: 2026-03-16 after initialization*
