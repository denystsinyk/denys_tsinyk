export interface SocialLink {
  label: string
  url: string
  icon: 'github' | 'linkedin' | 'email' | 'steam'
}

export const socialLinks: SocialLink[] = [
  { label: 'GitHub', url: 'https://github.com/GITHUB_USERNAME', icon: 'github' },
  { label: 'LinkedIn', url: 'https://linkedin.com/in/LINKEDIN_SLUG', icon: 'linkedin' },
  { label: 'Email', url: 'mailto:EMAIL_ADDRESS', icon: 'email' },
  { label: 'Steam', url: 'https://steamcommunity.com/profiles/76561198275331284', icon: 'steam' },
]
