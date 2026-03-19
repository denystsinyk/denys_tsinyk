import { FaSpotify } from 'react-icons/fa'
import type { SpotifyData, SpotifyTrack } from '../types/data'

interface MusicSectionProps {
  spotifyData: SpotifyData
  spotifyOk: boolean
}

function TrackCard({ track }: { track: SpotifyTrack }) {
  return (
    <a
      href={track.spotify_url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        flexShrink: 0,
        scrollSnapAlign: 'start',
        width: 120,
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
      }}
    >
      {/* Album art — square, 120×120 display */}
      {track.album_art ? (
        <img
          src={track.album_art}
          alt={track.name}
          style={{ display: 'block', width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 2 }}
        />
      ) : (
        <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: 'var(--color-divider)', borderRadius: 2 }} />
      )}
      {/* Track info below art */}
      <div style={{ paddingTop: 6 }}>
        <p style={{
          fontSize: 11, fontWeight: 600, color: 'var(--color-text)',
          margin: 0, marginBottom: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {track.name}
        </p>
        <p style={{
          fontSize: 10, opacity: 0.55, color: 'var(--color-text)',
          margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {track.artist}
        </p>
      </div>
    </a>
  )
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

  return (
    <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <h2
        className="text-sm font-medium mb-4 opacity-50"
        style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <FaSpotify style={{ color: '#1DB954', flexShrink: 0 }} />
        RECENTLY PLAYED
      </h2>

      <div
        className="hide-scrollbar"
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          overscrollBehaviorX: 'contain',
          paddingBottom: 8,
          paddingRight: 24,
        }}
      >
        {spotifyData.recent_tracks.map((track, i) => (
          <TrackCard key={i} track={track} />
        ))}
      </div>
    </section>
  )
}
