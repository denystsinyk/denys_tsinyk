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
  const formatted = new Intl.NumberFormat('en-US').format(hours)
  return `${formatted} hours played`
}

function GameCard({ game, isPlaying }: { game: SteamGame; isPlaying: boolean }) {
  return (
    <a
      href={`https://store.steampowered.com/app/${game.appid}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        flexShrink: 0,
        width: '184px',
        border: isPlaying ? '1px solid var(--color-accent)' : '1px solid var(--color-divider)',
        boxShadow: isPlaying ? '0 0 12px rgba(0,255,0,0.3)' : 'none',
        borderRadius: 4,
        overflow: 'hidden',
        position: 'relative',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <img
        src={capsuleUrl(game.appid)}
        alt={game.name}
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />

      {isPlaying && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            backgroundColor: 'rgba(0,0,0,0.75)',
            padding: '2px 6px',
            borderRadius: 3,
          }}
        >
          <span className="pulse-dot" />
          <span
            style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-accent)',
              letterSpacing: '0.05em',
            }}
          >
            PLAYING NOW
          </span>
        </div>
      )}

      <div
        style={{
          padding: '6px 8px',
          backgroundColor: 'var(--color-bg)',
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 2,
            color: 'var(--color-text)',
            margin: 0,
            marginBottom: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {game.name}
        </p>
        <p
          style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            opacity: 0.6,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          {formatHours(game.playtime_forever)}
        </p>
      </div>
    </a>
  )
}

export function GamingSection({ steamData, steamOk }: GamingSectionProps) {
  if (!steamOk || steamData.top_games.length === 0) {
    return (
      <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <h2 className="text-sm font-medium mb-4 opacity-50" style={{ color: 'var(--color-text)' }}>
          GAMES
        </h2>
        <p className="text-sm opacity-40" style={{ color: 'var(--color-text)' }}>
          Gaming stats unavailable
        </p>
      </section>
    )
  }

  const { top_games, currently_playing } = steamData
  const currentlyPlayingAppId = currently_playing?.appid ?? null
  const isCurrentInTop5 = top_games.some((g) => g.appid === currentlyPlayingAppId)

  return (
    <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <h2 className="text-sm font-medium mb-4 opacity-50" style={{ color: 'var(--color-text)' }}>
        GAMES
      </h2>

      {currently_playing && !isCurrentInTop5 && (
        <div className="flex gap-3 overflow-x-auto pb-3 mb-4">
          <GameCard game={currently_playing} isPlaying={true} />
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-3">
        {top_games.map((game) => (
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
