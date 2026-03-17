import { FaGithub, FaLinkedin, FaSteam } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import { socialLinks } from '../data/social'

const iconMap = {
  github: FaGithub,
  linkedin: FaLinkedin,
  email: MdEmail,
  steam: FaSteam,
}

interface FooterProps {
  updatedAt: string | null
}

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (diffMin < 60) return rtf.format(-diffMin, 'minute')
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return rtf.format(-diffHr, 'hour')
  return rtf.format(-Math.floor(diffHr / 24), 'day')
}

export function Footer({ updatedAt }: FooterProps) {
  return (
    <footer className="py-8" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <div className="flex gap-6 mb-3">
        {socialLinks.map((link) => {
          const Icon = iconMap[link.icon]
          return (
            <a
              key={link.icon}
              href={link.url}
              aria-label={link.label}
              target={link.icon !== 'email' ? '_blank' : undefined}
              rel="noopener noreferrer"
              className="text-xl hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-text)' }}
            >
              <Icon />
            </a>
          )
        })}
      </div>
      {updatedAt && (
        <p className="text-xs opacity-40" style={{ color: 'var(--color-text)' }}>
          updated {formatRelativeTime(updatedAt)}
        </p>
      )}
    </footer>
  )
}
