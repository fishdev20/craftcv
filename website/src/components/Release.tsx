'use client'

import { useEffect, useState } from 'react'
import { Skeleton } from '@heroui/react'
import { loadReleases, type GitHubRelease } from '@/lib/releases'
import { RELEASES, REPO, primary, secondary } from '@/lib/site'

type State =
  | { kind: 'loading' }
  | { kind: 'release'; release: GitHubRelease }
  | { kind: 'none' }
  | { kind: 'error' }

// the file names electron-builder.yml gives each build
const platforms = [
  {
    id: 'mac-arm64',
    label: 'macOS',
    detail: 'Apple Silicon (M1 and later)',
    match: /-mac-arm64\.dmg$/,
  },
  { id: 'mac-x64', label: 'macOS', detail: 'Intel', match: /-mac-x64\.dmg$/ },
  {
    id: 'linux',
    label: 'Linux',
    detail: 'AppImage, x86-64',
    match: /-linux-(x86_64|x64)\.AppImage$/,
  },
] as const

/** The platform this visitor is most likely on, to mark its build as recommended. */
function guessPlatform(): string | null {
  const agent = navigator.userAgent
  if (/Mac/i.test(agent)) return 'mac-arm64'
  if (/Linux/i.test(agent) && !/Android/i.test(agent)) return 'linux'
  return null
}

const size = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(0)} MB`
const date = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** The latest CraftCV release with a download for each platform, or a coming-soon card. */
export function Release({ icons }: { icons: Record<string, React.ReactNode> }) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [mine, setMine] = useState<string | null>(null)

  useEffect(() => {
    let live = true
    loadReleases()
      .then((releases) => {
        if (!live) return
        // the newest published release, a pre-release included
        const release = releases.find((item) => !item.draft)
        setMine(guessPlatform())
        setState(release ? { kind: 'release', release } : { kind: 'none' })
      })
      .catch(() => live && setState({ kind: 'error' }))
    return () => {
      live = false
    }
  }, [])

  if (state.kind === 'loading')
    return (
      <div
        className="card release m-nolift"
        aria-busy="true"
        aria-label="Loading the latest release"
      >
        <Skeleton className="h-6 w-2/5 rounded-lg" />
        {platforms.map((platform) => (
          <div className="release__row" key={platform.id}>
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="grid flex-1 gap-2">
              <Skeleton className="h-3 w-1/3 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        ))}
      </div>
    )

  if (state.kind === 'none')
    return (
      <div className="card release release--soon m-nolift">
        <span className="chip chip--blue">{icons.clock} Coming soon</span>
        <h2>The first release is on its way</h2>
        <p>
          CraftCV hasn’t published a build yet. Watch the repository on GitHub to hear when the
          first one ships, or build it from source today.
        </p>
        <div className="actions">
          <a className={primary} href={REPO}>
            {icons.github}
            Watch on GitHub
          </a>
          <a className={secondary} href={`${REPO}#readme`}>
            Read the build steps
          </a>
        </div>
      </div>
    )

  if (state.kind === 'error')
    return (
      <div className="card release release--soon m-nolift">
        <h2>The release list didn’t load</h2>
        <p>GitHub couldn’t be reached just now. Every build is also listed on GitHub itself.</p>
        <div className="actions">
          <a className={primary} href={RELEASES}>
            {icons.github}
            See releases on GitHub
          </a>
        </div>
      </div>
    )

  const { release } = state
  return (
    <div className="card release m-nolift">
      <div className="release__head">
        <div>
          <h2>{release.name || release.tag_name}</h2>
          {release.published_at && (
            <span className="ui-sub">Released {date(release.published_at)}</span>
          )}
        </div>
        <span className="chip chip--blue">{release.tag_name}</span>
        {release.prerelease && <span className="chip chip--grey">Pre-release</span>}
      </div>
      {platforms.map((platform) => {
        const asset = release.assets.find((item) => platform.match.test(item.name))
        return (
          <div className="release__row" key={platform.id}>
            <span className="release__icon">
              {platform.id === 'linux' ? icons.linux : icons.apple}
            </span>
            <div className="release__name">
              <b>
                {platform.label}
                {mine === platform.id && asset && (
                  <span className="chip chip--green">Recommended</span>
                )}
              </b>
              <span className="ui-sub">
                {platform.detail}
                {asset && ` · ${size(asset.size)}`}
              </span>
            </div>
            {asset ? (
              <a
                className={mine === platform.id ? primary : secondary}
                href={asset.browser_download_url}
              >
                {icons.download}
                Download
              </a>
            ) : (
              <span className="ui-sub">Not in this release</span>
            )}
          </div>
        )
      })}
      <div className="release__foot">
        <a className="link" href={release.html_url}>
          Read the release notes
        </a>
        <a className="link" href={RELEASES}>
          See every release
        </a>
      </div>
    </div>
  )
}
