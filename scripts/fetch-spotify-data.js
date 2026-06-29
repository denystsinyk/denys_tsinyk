import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.join(__dirname, '..', 'public', 'data.json')

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN

if (!SPOTIFY_CLIENT_ID) {
  console.error('Error: SPOTIFY_CLIENT_ID environment variable is required')
  process.exit(1)
}

if (!SPOTIFY_CLIENT_SECRET) {
  console.error('Error: SPOTIFY_CLIENT_SECRET environment variable is required')
  process.exit(1)
}

if (!SPOTIFY_REFRESH_TOKEN) {
  console.error('Error: SPOTIFY_REFRESH_TOKEN environment variable is required')
  process.exit(1)
}

async function main() {
  // read-patch-write: never overwrite the full file
  const existing = JSON.parse(fs.readFileSync(outputPath, 'utf8'))

  try {
    // Token exchange POST to Spotify accounts API
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: SPOTIFY_REFRESH_TOKEN,
      }),
    })

    if (!tokenRes.ok) {
      throw new Error(`Token exchange HTTP ${tokenRes.status}`)
    }

    const tokenJson = await tokenRes.json()
    const accessToken = tokenJson.access_token

    // Check for token rotation — Spotify may issue a new refresh token
    const newRefreshToken = tokenJson.refresh_token
    if (newRefreshToken && newRefreshToken !== SPOTIFY_REFRESH_TOKEN) {
      console.warn('Spotify returned a new refresh token — update SPOTIFY_REFRESH_TOKEN secret manually:', newRefreshToken)
    }

    // Recently-played fetch
    const recentRes = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=5',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!recentRes.ok) {
      throw new Error(`Recently played HTTP ${recentRes.status}`)
    }

    const recentJson = await recentRes.json()

    // Map to SpotifyTrack[] shape from src/types/data.ts
    const recentTracks = recentJson.items.map(item => ({
      name: item.track.name,
      artist: item.track.artists[0]?.name ?? 'Unknown',
      album_art: item.track.album.images[0]?.url ?? null,  // images[0] = largest (640x640)
      spotify_url: item.track.external_urls.spotify,
    }))

    existing.spotify = { recent_tracks: recentTracks, currently_playing: null }
    existing.spotify_ok = true

    console.log(`Spotify data fetched: ${recentTracks.length} tracks`)
  } catch (err) {
    console.error('Spotify fetch failed:', err.message)
    // Set spotify_ok to false but preserve existing spotify data (last good state)
    existing.spotify_ok = false
  }

  // Always update timestamp and write back (patch only — never overwrite full file)
  existing.updated_at = new Date().toISOString()
  fs.writeFileSync(outputPath, JSON.stringify(existing, null, 2))
  console.log(`data.json updated at ${outputPath}`)
}

main()
