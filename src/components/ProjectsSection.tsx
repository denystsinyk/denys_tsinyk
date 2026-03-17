import type { PinnedRepo } from '../types/data'

interface ProjectsSectionProps {
  repos: PinnedRepo[]
}

export function ProjectsSection({ repos }: ProjectsSectionProps) {
  return (
    <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <h2 className="text-sm font-medium mb-4 opacity-50" style={{ color: 'var(--color-text)' }}>
        Projects
      </h2>

      {repos.length === 0 ? (
        <p className="text-sm opacity-40" style={{ color: 'var(--color-text)' }}>
          No pinned repositories
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {repos.map((repo) => (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded border transition-colors hover:border-[var(--color-accent)]"
              style={{ borderColor: 'var(--color-divider)', color: 'inherit', textDecoration: 'none' }}
            >
              <p
                className="text-sm font-bold mb-1"
                style={{ color: 'var(--color-text)' }}
              >
                {repo.name}
              </p>

              <p
                className="text-xs mb-3 overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ color: 'var(--color-text)', opacity: 0.6 }}
              >
                {repo.description ?? '—'}
              </p>

              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-mono"
                  style={{ color: 'var(--color-text)', opacity: 0.7 }}
                >
                  ★ {repo.stargazerCount}
                </span>

                {repo.primaryLanguage && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: repo.primaryLanguage.color ?? '#888888' }}
                    />
                    {repo.primaryLanguage.name}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
