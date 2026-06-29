import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.join(__dirname, '..', 'public', 'data.json')

const GH_TOKEN = process.env.GH_TOKEN
const GH_LOGIN = process.env.GH_LOGIN

if (!GH_TOKEN) {
  console.error('Error: GH_TOKEN environment variable is required')
  process.exit(1)
}

if (!GH_LOGIN) {
  console.error('Error: GH_LOGIN environment variable is required')
  process.exit(1)
}

const query = `
  query($login: String!) {
    user(login: $login) {
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            stargazerCount
            primaryLanguage { name color }
          }
        }
      }
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays { contributionCount date }
          }
        }
      }
    }
  }
`

async function fetchGitHubData(login, token) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { login } }),
  })

  if (!res.ok) {
    throw new Error(`GitHub GraphQL request failed: HTTP ${res.status} ${res.statusText}`)
  }

  const json = await res.json()

  if (json.errors && json.errors.length > 0) {
    const messages = json.errors.map(e => e.message).join('; ')
    throw new Error(`GitHub GraphQL errors: ${messages}`)
  }

  if (!json.data || !json.data.user) {
    throw new Error(`GitHub GraphQL returned no user data for login: ${login}`)
  }

  return json.data.user
}

function computeStreak(weeks) {
  const days = weeks
    .flatMap(w => w.contributionDays)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  let streak = 0
  for (const day of days) {
    if (day.contributionCount > 0) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function computeTopLanguages(pinnedNodes) {
  const counts = {}
  const colors = {}

  for (const repo of pinnedNodes) {
    if (repo.primaryLanguage) {
      const { name, color } = repo.primaryLanguage
      counts[name] = (counts[name] ?? 0) + 1
      colors[name] = color
    }
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, color: colors[name], count }))
}

async function main() {
  let user
  try {
    user = await fetchGitHubData(GH_LOGIN, GH_TOKEN)
  } catch (err) {
    console.error('Failed to fetch GitHub data:', err.message)
    process.exit(1)
  }

  const pinnedNodes = user.pinnedItems.nodes
  const calendar = user.contributionsCollection.contributionCalendar

  const pinnedRepos = pinnedNodes.map(repo => ({
    name: repo.name,
    description: repo.description,
    url: repo.url,
    stargazerCount: repo.stargazerCount,
    primaryLanguage: repo.primaryLanguage,
  }))

  const topLanguages = computeTopLanguages(pinnedNodes)
  const contributionStreak = computeStreak(calendar.weeks)
  const totalContributionsThisYear = calendar.totalContributions

  const payload = {
    updated_at: new Date().toISOString(),
    steam_ok: false,
    spotify_ok: false,
    github: {
      pinned_repos: pinnedRepos,
      stats: {
        topLanguages,
        contributionStreak,
        totalContributionsThisYear,
      },
    },
    steam: {
      top_games: [],
      currently_playing: null,
    },
    spotify: {
      recent_tracks: [],
      currently_playing: null,
    },
  }

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2))
  console.log(`data.json written to ${outputPath}`)
  console.log(`  Updated at: ${payload.updated_at}`)
  console.log(`  Pinned repos: ${pinnedRepos.length}`)
  console.log(`  Top languages: ${topLanguages.map(l => l.name).join(', ')}`)
  console.log(`  Contribution streak: ${contributionStreak} days`)
  console.log(`  Total contributions this year: ${totalContributionsThisYear}`)
}

main()
