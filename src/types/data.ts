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
  updated_at: string
  steam_ok: boolean
  spotify_ok: boolean
  github: {
    pinned_repos: PinnedRepo[]
    stats: GitHubStats
  }
  steam: SteamData
  spotify: SpotifyData
}
