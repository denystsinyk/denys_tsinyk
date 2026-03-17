import { HeroSection } from './components/HeroSection'
import { WorkSection } from './components/WorkSection'
import { Footer } from './components/Footer'
import { ProjectsSection } from './components/ProjectsSection'
import { GitHubStatsSection } from './components/GitHubStatsSection'
import { useData } from './hooks/useData'

function App() {
  const { data, loading, error } = useData()

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <HeroSection name="Denys Tsinyk" />
        <WorkSection />

        {loading && <p className="text-sm opacity-50 py-4">Loading...</p>}
        {error && <p className="text-sm opacity-50 py-4">Could not load live data.</p>}

        {data && (
          <>
            <ProjectsSection repos={data.github.pinned_repos} />
            <GitHubStatsSection stats={data.github.stats} />

            {/* Steam section placeholder — Phase 3 will replace this */}
            {!data.steam_ok && (
              <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
                <p className="text-sm opacity-40" style={{ color: 'var(--color-text)' }}>Gaming stats unavailable</p>
              </section>
            )}

            {/* Spotify section placeholder — Phase 4 will replace this */}
            {!data.spotify_ok && (
              <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
                <p className="text-sm opacity-40" style={{ color: 'var(--color-text)' }}>Music unavailable</p>
              </section>
            )}

            <Footer updatedAt={data.updated_at} />
          </>
        )}

        {/* Footer without timestamp when data hasn't loaded */}
        {!data && !loading && <Footer updatedAt={null} />}
      </main>
    </div>
  )
}

export default App
