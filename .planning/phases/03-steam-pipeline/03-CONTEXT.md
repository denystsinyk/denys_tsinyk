# Phase 3: Steam Pipeline - Context

**Gathered:** 2026-03-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire up the GitHub Actions cron to fetch Steam API data and render a gaming section with the top 5 most played games (sorted by hours descending) and live "PLAYING NOW" detection. The hover states and staleness suppression for this section are Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Game card layout
- Single horizontal row with horizontal scroll (consistent with Spotify's track row in Phase 4)
- Each card shows: wide capsule art filling the top of the card, game name, and hours in monospace format ("1,234 hours played")
- No rank numbers — hours descending order is self-evident
- All cards are clickable and open `store.steampowered.com/app/{appid}` in a new tab
- Section header label: **GAMES**

### "PLAYING NOW" treatment
- "PLAYING NOW" badge overlaid on the top-left of the capsule art image
- Badge has an animated green pulse dot (●) using CSS animation — signals live/real-time data
- Active card gets a subtle green (#00ff00) box-shadow border glow — noticeable but not distracting
- When no game is currently playing, the top 5 render normally with no status indicator

### Currently playing card (not in top 5)
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

</decisions>

<specifics>
## Specific Ideas

- The horizontal scroll row for games should visually echo what Phase 4 will do for Spotify tracks — consistent section pattern
- The pulse dot animation on the PLAYING NOW badge is the primary "live data" signal

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-steam-pipeline*
*Context gathered: 2026-03-17*
