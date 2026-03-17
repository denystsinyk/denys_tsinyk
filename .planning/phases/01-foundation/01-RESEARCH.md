# Phase 1: Foundation - Research

**Researched:** 2026-03-16
**Domain:** React + Vite + TypeScript + Tailwind CSS v4 scaffold, GitHub Pages deployment via official Actions
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FNDN-01 | Project scaffolds with Vite 6 + React 18 + TypeScript 5 + Tailwind CSS v4 | Tailwind v4 Vite plugin confirmed — `npm install tailwindcss @tailwindcss/vite`, single `@import "tailwindcss"` in CSS, no postcss.config needed |
| FNDN-02 | Site deploys to GitHub Pages automatically on push via `deploy.yml` workflow with correct Vite `base` path | Official workflow confirmed — `actions/configure-pages@v5` injects `base_path` env var; `actions/deploy-pages@v4` handles deployment |
| PROF-01 | User sees "Denys Tsinyk" displayed prominently as the page header | Static React component with CSS custom properties; no external dependency |
| PROF-02 | User sees headshot photo displayed alongside name in the header section | Photo placed in `public/` folder (served at root URL); `<img src="/headshot.jpg">` or `/denys_tsinyk/headshot.jpg` depending on base — use Vite's `import.meta.env.BASE_URL` prefix |
| PROF-03 | User sees 3 work experience one-liners with no dates: "Software Engineer Intern @ NFL - Security automation", "Teaching Assistant @ Pitt - Data Structures & Algorithms", "Events Coordinator @ PittCSC" | Static array in `src/data/work.ts` — no API, no pipeline, hardcoded in source |
| PROF-04 | Subtle gray dividers visually separate each major section | Tailwind `border-t border-neutral-800` or CSS `border-top: 1px solid #1a1a1a` — standard CSS pattern |
| SOCL-01 | User sees footer with icon links for GitHub, LinkedIn, Email, and Steam profile | Static links with placeholder URLs in `src/data/social.ts`; icons via `react-icons` or inline SVG |
</phase_requirements>

---

## Summary

Phase 1 scaffolds the complete project from zero — Vite project creation, Tailwind v4 integration, static content authoring, and a working GitHub Pages deployment. The current repo contains only a README. Everything else is built in this phase.

The critical path in this phase is the Vite `base` path configuration. The repo name is `denys_tsinyk` (not a `username.github.io` root repo), so GitHub Pages serves from `https://denyststsinyk.github.io/denys_tsinyk/`. Without `base: '/denys_tsinyk/'` in `vite.config.ts`, all built assets (JS, CSS, images) will 404 and the deployed site will be blank. The recommended pattern uses `actions/configure-pages@v5` to inject the correct value automatically into the build, so `vite.config.ts` reads `process.env.VITE_BASE_PATH ?? '/'` — correct for both local dev (`/`) and CI (`/denys_tsinyk/`).

Tailwind CSS v4 (released February 2025) eliminates the PostCSS configuration entirely. It ships as a Vite plugin (`@tailwindcss/vite`) and requires only `@import "tailwindcss"` in the CSS entrypoint. The dark aesthetic is implemented via CSS custom properties at `:root` — `--color-bg: #0a0a0a`, `--color-accent: #00ff00` — which Tailwind v4's theme system can reference directly with `theme()` or by registering them in `@theme`. Work experience content is static source data (`src/data/work.ts`) and does NOT belong in `data.json` (the pipeline contract defined in Phase 2).

**Primary recommendation:** Scaffold with `npm create vite@latest` (react-ts template), install `tailwindcss @tailwindcss/vite`, write static content components, configure the `deploy.yml` workflow using `actions/configure-pages@v5` + `actions/deploy-pages@v4`, and confirm the live URL loads before Phase 2 starts.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.x | UI component tree | Stable LTS, broad ecosystem; React 19 available but 18.3 is safer — no migration risk |
| Vite | 6.x | Build tool + dev server | Replaces dead Create React App; sub-second HMR, first-class TypeScript, trivial `base` config |
| TypeScript | 5.x | Type safety | Catches shape mismatches early; required `strict: true` for the data.json contract in Phase 2 |
| Tailwind CSS | 4.x | Utility-first CSS | v4 Vite plugin — no postcss.config, works with `@import "tailwindcss"`, ideal for dark minimal aesthetic |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-icons | 5.x | Social link icons (GitHub, LinkedIn, Email, Steam) | Standard icon library; no custom SVG required for social footer |
| `@tailwindcss/vite` | 4.x | Vite plugin that integrates Tailwind v4 | Always with Tailwind v4 in Vite projects — this IS the integration path |

### Deployment
| Action | Version | Purpose | Why |
|--------|---------|---------|-----|
| `actions/configure-pages` | v5 | Injects correct `base_path` env var into Vite build | Eliminates manual hardcoded repo name in config; official GitHub action |
| `actions/upload-pages-artifact` | v3 | Packages `dist/` for Pages deployment | Required step in the official deploy pipeline |
| `actions/deploy-pages` | v4 | Deploys packaged artifact to GitHub Pages | Official action; no third-party trust, no `gh-pages` branch management |
| `actions/checkout` | v4 | Checkout repo | Standard; docs show v6 but v4 is stable and widely used |
| `actions/setup-node` | v4 | Node.js setup with npm cache | Standard |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-icons` | Inline SVG | Inline SVG is fine; react-icons saves time for standard social icons and has correct viewBox/aria attrs built in |
| `actions/configure-pages` + env var | Hardcode `base: '/denys_tsinyk/'` | Hardcoding works but breaks if repo is renamed; env var approach is safer long-term |
| `npm create vite@latest` (react-ts template) | Manual project setup | Manual setup adds risk; template produces correct `tsconfig.json`, `vite.config.ts`, and `index.html` |

**Installation:**
```bash
# Step 1: Scaffold
npm create vite@latest . -- --template react-ts
# (run inside the already-initialized denys_tsinyk repo)

# Step 2: Core dependencies
npm install

# Step 3: Tailwind CSS v4
npm install tailwindcss @tailwindcss/vite

# Step 4: Icons
npm install react-icons
```

---

## Architecture Patterns

### Recommended Project Structure (Phase 1 scope)
```
denys_tsinyk/
├── public/
│   ├── headshot.jpg         # Placed here by developer; served at BASE_URL/headshot.jpg
│   └── favicon.ico          # Required — missing = unfinished
├── src/
│   ├── components/
│   │   ├── HeroSection.tsx  # Name + headshot + tagline
│   │   ├── WorkSection.tsx  # 3 experience one-liners
│   │   └── Footer.tsx       # Social icon links
│   ├── data/
│   │   ├── work.ts          # Static work experience array
│   │   └── social.ts        # Social links (placeholder URLs)
│   ├── App.tsx              # Root layout, renders all sections
│   ├── main.tsx             # React entry point
│   └── index.css            # @import "tailwindcss" + :root tokens
├── .github/
│   └── workflows/
│       └── deploy.yml       # Push to main → Vite build → GitHub Pages
├── vite.config.ts           # base: process.env.VITE_BASE_PATH ?? '/'
├── tsconfig.json
└── package.json
```

**Note:** `src/types/data.ts`, `src/hooks/useData.ts`, and `scripts/` are Phase 2 additions. Do NOT create them in Phase 1.

### Pattern 1: Vite Base Path via Environment Variable

**What:** `vite.config.ts` reads `VITE_BASE_PATH` from environment; `actions/configure-pages` sets this to the correct subdirectory path in CI.
**When to use:** Every project deployed to GitHub Pages as a project repo (non-root domain).

```typescript
// vite.config.ts
// Source: https://vite.dev/guide/static-deploy.html#github-pages
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: process.env.VITE_BASE_PATH ?? '/',
})
```

### Pattern 2: Tailwind v4 CSS Entrypoint with Design Tokens

**What:** Single `@import "tailwindcss"` replaces the old `@tailwind base/components/utilities` directives. CSS custom properties at `:root` define the design system. Tailwind v4 can reference these via `theme()` or directly in classes via `--color-*` syntax.
**When to use:** Always in Tailwind v4.

```css
/* src/index.css */
/* Source: https://tailwindcss.com/docs/installation */
@import "tailwindcss";

:root {
  --color-bg: #0a0a0a;
  --color-accent: #00ff00;
  --color-text: #ffffff;
  --color-divider: #1a1a1a;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
}
```

### Pattern 3: Static Social Links as Typed Data

**What:** Social link data lives in `src/data/social.ts` as a typed array — not hardcoded in JSX.
**When to use:** Any content that renders as a list and may change later.

```typescript
// src/data/social.ts
export interface SocialLink {
  label: string
  url: string
  icon: 'github' | 'linkedin' | 'email' | 'steam'
}

export const socialLinks: SocialLink[] = [
  { label: 'GitHub', url: 'https://github.com/PLACEHOLDER', icon: 'github' },
  { label: 'LinkedIn', url: 'https://linkedin.com/in/PLACEHOLDER', icon: 'linkedin' },
  { label: 'Email', url: 'mailto:PLACEHOLDER@example.com', icon: 'email' },
  { label: 'Steam', url: 'https://steamcommunity.com/profiles/76561198275331284', icon: 'steam' },
]
```

### Pattern 4: Static Work Experience Data

**What:** Work experience is an array in `src/data/work.ts`. It is NOT part of `data.json` — it is source data that never changes without a code commit.
**When to use:** Any content that is stable, author-curated, and not from an API.

```typescript
// src/data/work.ts
export interface WorkExperience {
  role: string
  org: string
  description: string
}

export const workExperience: WorkExperience[] = [
  { role: 'Software Engineer Intern', org: 'NFL', description: 'Security automation' },
  { role: 'Teaching Assistant', org: 'Pitt', description: 'Data Structures & Algorithms' },
  { role: 'Events Coordinator', org: 'PittCSC', description: '' },
]
```

### Pattern 5: Headshot Image via `import.meta.env.BASE_URL`

**What:** Images in `public/` are served at `BASE_URL + filename`. In development `BASE_URL` is `/`; in production CI it becomes `/denys_tsinyk/`. Vite exposes `import.meta.env.BASE_URL` for exactly this use case.
**When to use:** Any reference to files in `public/` from JSX.

```tsx
// src/components/HeroSection.tsx
<img
  src={`${import.meta.env.BASE_URL}headshot.jpg`}
  alt="Denys Tsinyk"
  className="w-24 h-24 rounded-full object-cover"
/>
```

### Pattern 6: GitHub Actions Deploy Workflow

**What:** Official two-job deploy workflow — build job uploads `dist/`, deploy job releases to Pages.

```yaml
# .github/workflows/deploy.yml
# Source: https://vite.dev/guide/static-deploy.html#github-pages
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - uses: actions/configure-pages@v5
        id: pages
      - name: Build
        run: npm run build
        env:
          VITE_BASE_PATH: ${{ steps.pages.outputs.base_path }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**CRITICAL:** Before this workflow will succeed, GitHub Pages must be enabled in repository Settings → Pages → Source: "GitHub Actions".

### Anti-Patterns to Avoid

- **Hardcoding `base: '/denys_tsinyk/'`:** Works now but breaks if repo is renamed. Use the env var pattern from Pattern 1 instead.
- **`@tailwind base; @tailwind components; @tailwind utilities` in CSS:** That is Tailwind v3 syntax. In v4 use `@import "tailwindcss"` only.
- **Placing `data.json` in `src/`:** It is not needed in Phase 1. When it is created in Phase 2 it MUST go in `public/`, not `src/`.
- **Using `React Router`:** This is a single-page portfolio — no routing needed. Anchor links with `href="#section-id"` are sufficient.
- **Putting work experience in the pipeline:** Static content belongs in `src/data/`, not in `data.json`.
- **Forgetting `favicon.ico`:** Missing favicon = unfinished site. Vite scaffolds one; verify it is present.
- **Using `<img src="/headshot.jpg">` with absolute path:** Will 404 on GitHub Pages. Must use `import.meta.env.BASE_URL` prefix (see Pattern 5).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Social icons (GitHub, LinkedIn, Steam) | Custom SVG components | `react-icons` (FaGithub, FaLinkedin, FaSteam, MdEmail) | react-icons has correct viewBox, aria-label, and TypeScript types; standard library with 30k+ icons |
| CSS reset + base styles | Custom reset.css | Tailwind's built-in Preflight (included in `@import "tailwindcss"`) | Tailwind v4 includes Preflight automatically; no separate normalize/reset needed |
| Build + deploy automation | Custom deploy script | `actions/configure-pages` + `actions/deploy-pages` | Official actions handle OIDC token exchange, Pages API calls, and artifact management correctly |
| Responsive layout grid | Custom CSS grid system | Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) | Standard approach, no custom breakpoint logic needed |

**Key insight:** Phase 1 is almost entirely scaffolding and configuration. The investment is in getting the project structure and deployment pipeline right — not in custom code.

---

## Common Pitfalls

### Pitfall 1: Vite `base` Misconfiguration (most common Phase 1 failure)
**What goes wrong:** Deployed site loads blank; browser DevTools shows all JS/CSS assets returning 404 with paths missing `/denys_tsinyk/` prefix.
**Why it happens:** `vite dev` always uses base `/`, masking the mismatch. The error only surfaces after deployment.
**How to avoid:** Set `base: process.env.VITE_BASE_PATH ?? '/'` in `vite.config.ts`. In `deploy.yml`, use `actions/configure-pages@v5` and pass `VITE_BASE_PATH: ${{ steps.pages.outputs.base_path }}` to the build step.
**Warning signs:** Local `vite preview` with `VITE_BASE_PATH=/denys_tsinyk/ npm run preview` shows 404 errors before even deploying.

### Pitfall 2: GitHub Pages Source Not Configured
**What goes wrong:** Workflow runs successfully (green checkmark) but `https://username.github.io/denys_tsinyk/` returns 404.
**Why it happens:** GitHub Pages is not enabled by default. The Actions workflow must deploy to the Pages environment, but Pages source must be set to "GitHub Actions" in repo settings.
**How to avoid:** Before first push, go to repository Settings → Pages → Source and select "GitHub Actions". This is a one-time manual step.
**Warning signs:** Deploy workflow shows green but no Pages URL is shown in the environment output.

### Pitfall 3: Tailwind v4 PostCSS Config Conflict
**What goes wrong:** A `postcss.config.js` or `postcss.config.ts` file from Tailwind v3 docs/tutorials causes double-processing or build errors.
**Why it happens:** Many tutorials still show the v3 PostCSS setup. Tailwind v4 uses the Vite plugin only — no PostCSS config is needed or wanted.
**How to avoid:** Do not create `postcss.config.js`. Only configure Tailwind in `vite.config.ts` via the `@tailwindcss/vite` plugin.
**Warning signs:** Build error mentioning PostCSS or styles not applying.

### Pitfall 4: Headshot 404 on Deployed Site
**What goes wrong:** Headshot renders in local dev but shows broken image on GitHub Pages.
**Why it happens:** `src="/headshot.jpg"` resolves to `/headshot.jpg` in dev (correct) but to `/headshot.jpg` in production where the actual path is `/denys_tsinyk/headshot.jpg`.
**How to avoid:** Always reference `public/` files using `import.meta.env.BASE_URL` prefix: `src={`${import.meta.env.BASE_URL}headshot.jpg`}`.
**Warning signs:** Image broken only on the live site, not in local dev or preview.

### Pitfall 5: GitHub Actions Workflow Permissions Missing
**What goes wrong:** Deploy workflow fails with "Resource not accessible by integration" error.
**Why it happens:** The workflow needs `pages: write` and `id-token: write` permissions to deploy to Pages, and `contents: read` at minimum. These must be declared explicitly.
**How to avoid:** Include the exact `permissions` block from Pattern 6 in `deploy.yml`.
**Warning signs:** Workflow fails on the `actions/deploy-pages` step with a permission error.

### Pitfall 6: `npm create vite` Inside Existing Git Repo
**What goes wrong:** `npm create vite@latest` creates a subdirectory instead of scaffolding into the current directory when the project name conflicts with the existing directory structure.
**Why it happens:** Running `npm create vite@latest denys_tsinyk` from the parent of the repo creates a new `denys_tsinyk/` subdirectory rather than scaffolding into the existing repo.
**How to avoid:** `cd` into the repo first, then run `npm create vite@latest . -- --template react-ts` (note the `.` — scaffold into current directory).
**Warning signs:** A nested `denys_tsinyk/denys_tsinyk/` directory is created.

---

## Code Examples

Verified patterns from official sources:

### Tailwind v4 + Vite Plugin Setup
```typescript
// vite.config.ts
// Source: https://tailwindcss.com/docs/installation (verified 2026-03-16)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: process.env.VITE_BASE_PATH ?? '/',
})
```

### Tailwind v4 CSS Entrypoint
```css
/* src/index.css */
/* Source: https://tailwindcss.com/docs/installation (verified 2026-03-16) */
@import "tailwindcss";

:root {
  --color-bg: #0a0a0a;
  --color-accent: #00ff00;
  --color-text: #ffffff;
  --color-divider: #1a1a1a;
  --font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  min-height: 100vh;
  margin: 0;
}
```

### HeroSection with Correct Image Path
```tsx
// src/components/HeroSection.tsx
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
      <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
        {name}
      </h1>
    </section>
  )
}
```

### WorkSection
```tsx
// src/components/WorkSection.tsx
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
            {item.description && <span className="text-neutral-400"> — {item.description}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
```

### Footer with Social Icons
```tsx
// src/components/Footer.tsx
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
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@tailwind base; @tailwind components; @tailwind utilities` | `@import "tailwindcss"` | Tailwind v4 (Feb 2025) | No PostCSS config needed; Vite plugin handles everything |
| `tailwind.config.js` for theme config | `@theme` block in CSS or CSS custom properties | Tailwind v4 (Feb 2025) | JS config file optional; design tokens live in CSS |
| `peaceiris/actions-gh-pages` | `actions/deploy-pages@v4` | 2022-2023 | Official action; no PAT required, no `gh-pages` branch management |
| `actions/checkout@v3` | `actions/checkout@v4` | 2023 | v4 uses Node 20, required for current runners |
| Create React App (`npx create-react-app`) | `npm create vite@latest` | CRA deprecated 2023 | Vite is 10-100x faster, actively maintained |

**Deprecated/outdated:**
- `postcss.config.js` for Tailwind: Tailwind v4 uses the Vite plugin, not PostCSS. A postcss config file will conflict.
- `tailwind.config.js` (required in v3): Now optional in v4. For simple projects, CSS custom properties are sufficient without a config file.
- `peaceiris/actions-gh-pages`: Still works but requires a PAT secret; replaced by the official `actions/deploy-pages` which uses OIDC and `GITHUB_TOKEN`.

---

## Open Questions

1. **Exact real social link URLs**
   - What we know: Steam ID is `76561198275331284` (confirmed in STATE.md); GitHub username and LinkedIn URL are not specified
   - What's unclear: The actual GitHub username (is the repo at `github.com/DenysTsinyk/denys_tsinyk`? Or another casing?), and the LinkedIn URL slug
   - Recommendation: Use clearly-labeled placeholder strings like `https://github.com/GITHUB_USERNAME` and `https://linkedin.com/in/LINKEDIN_SLUG` in `src/data/social.ts`; update after Phase 1 is live

2. **Headshot filename and format**
   - What we know: Photo will be placed in `public/` folder (confirmed in additional context)
   - What's unclear: The exact filename (headshot.jpg? profile.jpg? photo.png?)
   - Recommendation: Use `headshot.jpg` as the canonical filename in the component; document clearly in task that the developer must place a photo at `public/headshot.jpg` before task is complete

3. **Font loading strategy**
   - What we know: Design calls for monospace for data values and clean sans-serif for prose
   - What's unclear: Whether to use Google Fonts (JetBrains Mono + Inter), system fonts only, or `fontsource` npm packages
   - Recommendation: Use Google Fonts via `<link>` in `index.html` for Phase 1 simplicity; if privacy matters, switch to `fontsource` later (Phase 5 polish)

---

## Sources

### Primary (HIGH confidence)
- https://tailwindcss.com/docs/installation — Tailwind v4 Vite installation steps verified 2026-03-16; `@import "tailwindcss"` syntax and `@tailwindcss/vite` package confirmed
- https://vite.dev/guide/static-deploy.html — Vite GitHub Pages deployment workflow with `actions/configure-pages@v5` + `actions/deploy-pages@v4` confirmed 2026-03-16
- Project research files (STACK.md, ARCHITECTURE.md, PITFALLS.md) — created 2026-03-16, HIGH confidence for stack choices, MEDIUM for pitfall specifics

### Secondary (MEDIUM confidence)
- `import.meta.env.BASE_URL` for referencing `public/` assets — documented Vite feature, stable across versions; training data Aug 2025

### Tertiary (LOW confidence)
- Font loading strategy (Google Fonts vs fontsource) — no current-year verification; recommendation is pragmatic default for Phase 1

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Tailwind v4 + Vite 6 + React 18 all verified against official docs 2026-03-16
- Architecture: HIGH — patterns derived from official Vite and Tailwind docs; project file structure confirmed against research files
- Pitfalls: HIGH — Vite base path and GitHub Pages configuration issues verified against official docs; `import.meta.env.BASE_URL` pattern is documented Vite behavior

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable ecosystem; Tailwind v4 is new but its Vite integration is documented and stable)
