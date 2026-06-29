# Phase 4: Spotify Integration - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the Spotify OAuth refresh-token fetch pipeline and render the last 5 recently played tracks as a horizontal scrollable music section on the portfolio. Pipeline and UI only — no playback controls, no search, no playlist features.

</domain>

<decisions>
## Implementation Decisions

### Track card details
- Show only: square album art + track name + artist name (nothing else)
- Truncate long track names and artist names with ellipsis — no wrapping, no marquee
- Subtle lift/shadow hover effect (consistent with GameCard from Phase 3)
- Album art size matches Steam game art size from Phase 3 for visual consistency

### Scroll interaction
- Snap-scroll per card (scroll lands cleanly on card boundaries)
- No prev/next arrow buttons — scroll only
- Hide browser scrollbar (overflow still scrollable)
- Show partial "peek" of next card (~20–30px) at the row edge to signal more content

### Fallback / error state
- Show a simple text message when spotify_ok is false or tracks array is empty
- Neutral/informational tone: e.g. "Music data is currently unavailable"
- Section collapses to minimal height — no wasted space, just the message

### Section framing
- Section heading: "Recently Played"
- Small Spotify logo/icon placed next to the heading (source attribution)
- Matches Gaming section structure exactly — same heading level, container width, spacing

### Claude's Discretion
- Exact fallback message copy (within neutral/informational tone)
- Card gap and padding values
- Exact peek width (around 20–30px)
- How to render the Spotify logo (SVG inline, img tag, or icon library)

</decisions>

<specifics>
## Specific Ideas

- Music section should feel like a sibling to the Gaming section — same visual language, same structural pattern
- No extra metadata per track beyond what's specified (no duration, no play count, no "currently playing" badge)
- The Spotify logo in the heading provides attribution without cluttering the section

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-spotify-integration*
*Context gathered: 2026-03-18*
