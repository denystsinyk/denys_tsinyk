import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.join(__dirname, '..', 'public', 'data.json')

const STEAM_API_KEY = process.env.STEAM_API_KEY
const STEAM_ID = process.env.STEAM_ID

if (!STEAM_API_KEY) {
  console.error('Error: STEAM_API_KEY environment variable is required')
  process.exit(1)
}

if (!STEAM_ID) {
  console.error('Error: STEAM_ID environment variable is required')
  process.exit(1)
}

async function main() {
  const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'))

  try {
    // Fetch 1: GetOwnedGames — top 5 most played games
    const ownedRes = await fetch(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/` +
      `?key=${STEAM_API_KEY}&steamid=${STEAM_ID}&include_appinfo=1&format=json`
    )
    if (!ownedRes.ok) {
      throw new Error(`GetOwnedGames HTTP ${ownedRes.status} ${ownedRes.statusText}`)
    }
    const ownedJson = await ownedRes.json()
    const allGames = ownedJson.response?.games ?? []

    // Sort by total playtime descending, take top 5
    const topGames = [...allGames]
      .sort((a, b) => b.playtime_forever - a.playtime_forever)
      .slice(0, 5)
      .map(g => ({
        appid: g.appid,
        name: g.name,
        playtime_forever: g.playtime_forever,
        img_icon_url: g.img_icon_url,
      }))

    // Fetch 2: GetPlayerSummaries — currently playing detection
    const summaryRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/` +
      `?key=${STEAM_API_KEY}&steamids=${STEAM_ID}&format=json`
    )
    if (!summaryRes.ok) {
      throw new Error(`GetPlayerSummaries HTTP ${summaryRes.status} ${summaryRes.statusText}`)
    }
    const summaryJson = await summaryRes.json()
    const player = summaryJson.response?.players?.[0]

    let currentlyPlaying = null
    if (player?.gameid) {
      // gameid from GetPlayerSummaries is a STRING — parseInt for comparison with appid (number)
      const activeAppId = parseInt(player.gameid, 10)
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

    const currentlyPlayingName = currentlyPlaying?.name ?? 'none'
    console.log(`Steam data fetched: ${topGames.length} top games, currently playing: ${currentlyPlayingName}`)
  } catch (err) {
    console.error('Steam fetch failed:', err.message)
    // Set steam_ok to false but preserve existing steam data (last good state)
    existing.steam_ok = false
  }

  // Always update timestamp and write back (patch only — never overwrite full file)
  existing.updated_at = new Date().toISOString()
  fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2))
  console.log(`data.json updated at ${outputPath}`)
}

main()
