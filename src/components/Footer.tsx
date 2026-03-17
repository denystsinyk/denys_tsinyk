import { FaGithub, FaLinkedin, FaSteam } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import { socialLinks } from '../data/social'

const iconMap = {
  github: FaGithub,
  linkedin: FaLinkedin,
  email: MdEmail,
  steam: FaSteam,
}

export function Footer() {
  return (
    <footer className="py-8 flex gap-6" style={{ borderTop: '1px solid var(--color-divider)' }}>
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
    </footer>
  )
}
