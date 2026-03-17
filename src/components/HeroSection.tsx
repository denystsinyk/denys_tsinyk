interface HeroSectionProps {
  name: string
}

export function HeroSection({ name }: HeroSectionProps) {
  return (
    <section className="flex items-center gap-6 py-12">
      <img
        src={`${import.meta.env.BASE_URL}headshot.jpg`}
        alt={name}
        width={96}
        height={96}
        className="rounded-full object-cover"
        style={{ width: 96, height: 96 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          {name}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text)', opacity: 0.5 }}>
          Software Engineer
        </p>
      </div>
    </section>
  )
}
