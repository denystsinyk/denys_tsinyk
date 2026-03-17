import { workExperience } from '../data/work'

export function WorkSection() {
  return (
    <section className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <ul className="space-y-2">
        {workExperience.map((item, i) => (
          <li key={i} className="text-sm" style={{ color: 'var(--color-text)' }}>
            <span className="font-medium">{item.role}</span>
            {' @ '}
            <span>{item.org}</span>
            {item.description && <span style={{ color: 'var(--color-text)', opacity: 0.5 }}> — {item.description}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
