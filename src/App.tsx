import { HeroSection } from './components/HeroSection'
import { WorkSection } from './components/WorkSection'
import { Footer } from './components/Footer'

function App() {
  return (
    <div style={{ backgroundColor: 'var(--color-bg)', minHeight: '100vh' }}>
      <main className="max-w-2xl mx-auto px-6 py-12">
        <HeroSection name="Denys Tsinyk" />
        <WorkSection />
        <Footer />
      </main>
    </div>
  )
}

export default App
