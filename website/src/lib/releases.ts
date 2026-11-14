import { RELEASES_API } from './site'

type Asset = { name: string; size: number; browser_download_url: string }
export type GitHubRelease = {
  tag_name: string
  name: string | null
  html_url: string
  draft: boolean
  prerelease: boolean
  published_at: string | null
  assets: Asset[]
}

const CACHE_KEY = 'craftcv:releases'
const CACHE_MS = 10 * 60 * 1000

/** Reads the releases from GitHub, at most once every ten minutes per visitor. */
export async function loadReleases(): Promise<GitHubRelease[]> {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? 'null')
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.releases
  } catch {
    // no storage in this browser: fetch every time
  }
  const response = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`)
  const releases = (await response.json()) as GitHubRelease[]
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), releases }))
  } catch {
    // the cache is only a convenience
  }
  return releases
}
