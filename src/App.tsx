import { HeroSection } from './components/HeroSection'
import { WorkSection } from './components/WorkSection'
import { Footer } from './components/Footer'
import { ProjectsSection } from './components/ProjectsSection'
import { GitHubStatsSection } from './components/GitHubStatsSection'
import { GamingSection } from './components/GamingSection'
import { MusicSection } from './components/MusicSection'
import { useData } from './hooks/useData'

function App() {
  const { data, loading, error, isStale } = useData()

  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <main className="max-w-4xl mx-auto px-6 py-12">
        <HeroSection name="Denys Tsinyk" />
        <WorkSection />

        {loading && <p className="text-sm opacity-50 py-4">Loading...</p>}
        {error && <p className="text-sm opacity-50 py-4">Could not load live data.</p>}

        {data && (
          <>
            <ProjectsSection repos={data.github.pinned_repos} />
            <GitHubStatsSection stats={data.github.stats} />

            <GamingSection steamData={data.steam} steamOk={data.steam_ok} isStale={isStale} />

            <MusicSection spotifyData={data.spotify} spotifyOk={data.spotify_ok} />

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
