import type { GitHubStats } from '../types/data'

interface GitHubStatsSectionProps {
  stats: GitHubStats
}

export function GitHubStatsSection({ stats }: GitHubStatsSectionProps) {
  const sortedLanguages = [...stats.topLanguages].sort((a, b) => b.count - a.count)

  return (
    <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <h2 className="text-sm font-medium mb-4 opacity-50" style={{ color: 'var(--color-text)' }}>
        GitHub Stats
      </h2>

      <div className="mb-4">
        <div className="mb-1 text-xs opacity-40" style={{ color: 'var(--color-text)' }}>
          Top Languages
        </div>
        {sortedLanguages.length === 0 ? (
          <span className="text-sm opacity-40" style={{ color: 'var(--color-text)' }}>—</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedLanguages.map((lang) => (
              <span
                key={lang.name}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
                style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text)' }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: lang.color ?? '#888888' }}
                />
                {lang.name}
                <span className="font-mono opacity-50">{lang.count}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-1 text-xs opacity-40" style={{ color: 'var(--color-text)' }}>
          Contribution Streak
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text)' }}>
          <span className="font-mono text-lg" style={{ color: 'var(--color-accent)' }}>
            {stats.contributionStreak}
          </span>{' '}
          day streak
        </p>
        <p className="text-xs mt-1 opacity-40" style={{ color: 'var(--color-text)' }}>
          {stats.totalContributionsThisYear} contributions this year
        </p>
      </div>
    </section>
  )
}
