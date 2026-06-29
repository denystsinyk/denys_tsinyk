# Feature Landscape

**Domain:** Dark minimal personal developer portfolio — data-forward / live-data variant
**Researched:** 2026-03-16
**Confidence note:** Web/WebFetch tools were unavailable during research. Findings are based on training data (knowledge through mid-2025) covering hundreds of public portfolio repos, Reddit /r/webdev showcases, and GitHub "portfolio" topic. Marked confidence levels reflect this.

---

## Table Stakes

Features visitors expect. Missing = product feels incomplete or unprofessional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Name + one-liner bio at top | First thing every visitor reads; sets who this person is | Low | Should be above the fold, instant |
| Work experience / professional section | Hiring managers and peers expect to see employment context | Low | PROJECT.md specifies 3 one-liner entries, no dates — good minimal approach |
| Projects section | Portfolios without projects feel empty; this is the core proof of work | Med | Pinned GitHub repos with stars + language badge is the current standard |
| Social / contact links | Visitors need a path to reach out or verify identity | Low | GitHub, LinkedIn, Email, Steam — already scoped |
| Dark background | The aesthetic IS the brand promise for this site; light mode would break the concept | Low | `#0a0a0a` chosen; pure black is valid in this niche |
| Responsive layout | Mobile traffic is ~50%+ even for dev portfolios shared on social/LinkedIn | Med | Must not break on phone even if desktop-first design |
| Fast load time | Slow portfolio = bad first impression, especially for an engineer's site | Med | Static + data.json pre-fetch already handles this well |
| Consistent typography | Monospace for data, sans-serif for copy is the established pattern in this aesthetic | Low | Already scoped in PROJECT.md |
| Favicon and page title | Missing favicon reads as "unfinished"; title used in browser history / bookmarks | Low | Often forgotten, never acceptable to skip |
| Readable contrast | WCAG AA minimum — dark sites often fail this with grey-on-dark text | Low | White text on `#0a0a0a` is fine; watch for secondary text color choices |

---

## Differentiators

Features that make this site stand out. Not universally expected, but high signal when done well.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Live Steam "currently playing" with green pulse badge | Shows personality; gaming on a portfolio is a deliberate identity statement, and real-time state is compelling | Med | Requires GitHub Actions cron + Steam `GetPlayerSummaries` endpoint; green `#00ff00` pulse glow as scoped |
| Top 5 Steam games by hours + capsule art | Concrete, verifiable data about who this person is outside work — much more interesting than "I like gaming" | Med | Steam `GetOwnedGames` API; capsule images served from Steamcdn |
| Spotify last 5 tracks with album art | Music taste is personality signal; horizontal scroll row feels live/active, not static | Med | Requires Spotify `recently-played` endpoint + refresh token flow via Actions |
| GitHub contribution streak + top languages bar | Demonstrates consistent activity, not just "I have repos"; top languages bar reveals actual skill composition vs resume claims | Med | GitHub GraphQL API (public, no auth for public profiles); github-readme-stats-style rendering or custom SVG |
| No dates on work experience | Anti-chronological-anxiety — shows confidence; common in dark/brutalist portfolios that reject resume conventions | Low | Already a project decision; worth preserving as intentional design choice |
| Cron-refreshed data.json as data layer | Technically clean solution; sophisticated visitors (engineers) will notice and respect this architecture | High | Already scoped; the complexity is in the GitHub Actions workflow + Spotify token refresh |
| Game capsule art grid visual density | Steam game capsule images at consistent size create a visually rich section with zero custom design work | Low | CSS grid or flex row; images fetched from `steamcdn-a.akamaihd.net` |
| Terminal / monospace aesthetic for stats | Makes data values feel like output from a real system, not a resume widget | Low | Font choice only; high visual return for zero complexity |
| "PLAYING NOW" badge on active game | Real-time proof the data is live, not static; creates a "is this working?" moment that makes visitors reload | Low | Conditional render based on `personastate` or `gameid` field in Steam response |

---

## Anti-Features

Features to explicitly NOT build. These are either bloat, common traps, or misaligned with the site's purpose.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Contact form | Adds server-side complexity or third-party dependency (Formspree etc.); most devs who visit a portfolio just want an email link | Plain `mailto:` link in footer |
| Blog / writing section | Doubles the maintenance burden; empty blog is worse than no blog; not in scope | Link to external platform (e.g. DEV.to, Substack) if writing is desired later |
| Skills list with progress bars | "JavaScript: 85%" is meaningless and looks amateur; no data supports the percentage | Let GitHub top languages bar show real-world skill distribution instead |
| Animations on page load (heavy) | Slows perceived load time; flashy intros feel dated; most visitors are on second+ visit via shared link | Subtle hover states only (scale + glow already scoped) |
| Dark/light mode toggle | Adds complexity for a site whose entire identity is dark; a toggle implies the dark theme is optional, not intentional | Hard-code dark; own the aesthetic |
| Infinite scroll / pagination on any section | The site is a snapshot, not a feed; pagination signals "I have a lot to show" but adds complexity for little gain | Cap sections at fixed counts (top 5 games, last 5 tracks, pinned repos already scoped) |
| Custom cursor | Common in "creative portfolio" templates; looks out of place on a minimalist data-focused site | None; system cursor is correct here |
| Client-side API calls to Steam/Spotify | Would expose API keys; Steam API explicitly requires server-side usage | GitHub Actions cron writing data.json — already correctly scoped |
| Testimonials / recommendations section | Feels like a LinkedIn copy; doesn't fit the brutalist/dashboard aesthetic | Skip entirely |
| "Currently available for hire" banner | Pressure-sale feel; inconsistent with the confident, understated tone this aesthetic requires | If employment status matters, one line in the bio is enough |
| Loader / splash screen | Delays access to content; the site should be instant given its static nature | None; fast first paint is the goal |
| Typewriter animation on bio text | Overused; adds perceived load delay; undermines the "this is real data" framing | Static text renders immediately |
| Social share / Open Graph image per section | Over-engineering for a personal site at this scope | One good `og:image` meta tag in head is sufficient |

---

## Feature Dependencies

```
GitHub Actions cron workflow
  → data.json file written to public/
      → Steam currently-playing badge (reads gameid from data.json)
      → Steam top 5 games section (reads games array from data.json)
      → Spotify last 5 tracks section (reads tracks array from data.json)

GitHub API (client-side, public)
  → Pinned repos section (stars, language)
  → GitHub top languages bar
  → Contribution streak

Spotify refresh token (GitHub Actions secret)
  → Actions workflow can exchange for access token
      → recently-played endpoint
          → Spotify tracks section

Steam API key (GitHub Actions secret)
  → GetPlayerSummaries (currently playing status)
  → GetOwnedGames (top played games + hours)
      → capsule art URLs (derived from appid, fetched from Steamcdn)

data.json schema
  → All Steam + Spotify sections depend on this contract
  → Must be defined early; changes break all consumers
```

---

## MVP Recommendation

Build in this priority order:

1. **Static skeleton** — Name, bio, work experience, projects (GitHub API), social links. This is a complete, shippable portfolio with no data pipeline risk.
2. **GitHub stats section** — Top languages + streak. Public API, no secrets, validates the GitHub API integration pattern.
3. **data.json schema + GitHub Actions workflow** — Define the data contract first, then implement the Steam and Spotify fetches. Get the Actions pipeline working with real data.
4. **Steam section** — Top 5 games + currently-playing badge. Steam API is simpler than Spotify (no OAuth refresh loop).
5. **Spotify section** — Last 5 tracks. Spotify token refresh is the trickiest part of the data pipeline; validate it works before relying on it.
6. **Polish** — Hover states, green pulse glow, monospace formatting, responsive tweaks.

**Defer permanently:**
- Contact form — email link is sufficient
- Blog — not in scope, creates maintenance debt
- Dark/light toggle — undermines the design intent

---

## Confidence Assessment

| Finding | Confidence | Reason |
|---------|------------|--------|
| Table stakes list | MEDIUM | Based on training data across hundreds of portfolio examples through mid-2025; web verification unavailable |
| Live-data features as differentiators | MEDIUM | Dashboard-style portfolios are a known niche; Steam+Spotify specifically are well-documented patterns on GitHub |
| Anti-features list | HIGH | These are widely documented mistakes in /r/webdev, frontend communities, and portfolio critique threads; patterns are stable |
| GitHub Actions as Spotify/Steam fetch mechanism | HIGH | Confirmed as the correct pattern for static sites needing secrets; documented in multiple public repos |
| Feature dependencies | HIGH | Derived directly from PROJECT.md constraints and standard API behavior |
| Spotify token refresh complexity | MEDIUM | Known OAuth pattern; specific Actions implementation details would benefit from checking a reference implementation |

---

## Sources

- Project context: `C:/Users/denys/Desktop/denys_tsinyk/.planning/PROJECT.md`
- Training data: public portfolio repos (GitHub "portfolio" topic), /r/webdev portfolio showcases, and portfolio critique discussions through mid-2025
- Web/WebFetch tools unavailable during this research session — findings not externally verified beyond training data
- Note: The Steam API docs (developer.valvesoftware.com), Spotify Web API docs (developer.spotify.com), and GitHub GraphQL API docs (docs.github.com/graphql) are the authoritative sources for API capability claims made here and should be consulted during implementation phases
