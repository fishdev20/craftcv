'use client'

import { useEffect, useRef, useState } from 'react'
import { REPO, REPO_API } from '@/lib/site'

type Result = 'starred' | 'already' | 'denied' | 'failed'

const CACHE_KEY = 'craftcv:stars'
const STARRED_KEY = 'craftcv:starred'
const CACHE_MS = 10 * 60 * 1000
const LOGIN = '/api/github/login/'

// storage can be missing or blocked; every use is a convenience the button works without
const read = (store: () => Storage, key: string) => {
  try {
    return store().getItem(key)
  } catch {
    return null
  }
}
const write = (store: () => Storage, key: string, value: string | null) => {
  try {
    if (value === null) store().removeItem(key)
    else store().setItem(key, value)
  } catch {
    // nothing to do
  }
}
const session = () => sessionStorage
const local = () => localStorage

/** The repository's star count from GitHub, at most once every ten minutes per visitor. */
async function loadStars(): Promise<number> {
  const cached = JSON.parse(read(session, CACHE_KEY) ?? 'null')
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.stars
  const response = await fetch(REPO_API, { headers: { Accept: 'application/vnd.github+json' } })
  if (!response.ok) throw new Error(`GitHub answered ${response.status}`)
  const stars = ((await response.json()) as { stargazers_count: number }).stargazers_count
  write(session, CACHE_KEY, JSON.stringify({ at: Date.now(), stars }))
  return stars
}

/** The result a full-page sign-in left in the address (`?star=`), removed once read. */
function takeRedirectResult(): Result | null {
  const url = new URL(window.location.href)
  const result = url.searchParams.get('star') as Result | null
  if (!result) return null
  url.searchParams.delete('star')
  window.history.replaceState(null, '', url)
  return result
}

const short = (count: number) =>
  count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : String(count)

/**
 * Stars the repository from the site. The first press opens GitHub's sign-in in a popup;
 * once the visitor approves, the server stars the repository with a token it then revokes
 * (src/app/api/github), and the count here goes up. Starred already, the button opens the
 * repository instead.
 */
export function GitHubStars({
  icons,
}: {
  icons: { github: React.ReactNode; star: React.ReactNode }
}) {
  const [stars, setStars] = useState<number | null>(null)
  const [starred, setStarred] = useState(false)
  const [busy, setBusy] = useState(false)
  const stopWaiting = useRef<() => void>(() => {})

  useEffect(() => {
    let live = true
    const fromRedirect = takeRedirectResult()
    // a fresh star should show in the count, so skip the cache this once
    if (fromRedirect === 'starred') write(session, CACHE_KEY, null)
    if (fromRedirect === 'starred' || fromRedirect === 'already') write(local, STARRED_KEY, '1')
    const settle = (count: number | null) => {
      if (!live) return
      setStarred(read(local, STARRED_KEY) === '1')
      setStars(count)
    }
    loadStars().then(settle, () => settle(null))
    return () => {
      live = false
      stopWaiting.current()
    }
  }, [])

  function done(result: Result) {
    if (result !== 'starred' && result !== 'already') return
    write(local, STARRED_KEY, '1')
    setStarred(true)
    if (result === 'starred')
      setStars((count) => {
        if (count === null) return count
        write(session, CACHE_KEY, JSON.stringify({ at: Date.now(), stars: count + 1 }))
        return count + 1
      })
  }

  function star(event: React.MouseEvent<HTMLAnchorElement>) {
    // starred already: let the link open the repository
    if (starred) return
    event.preventDefault()
    if (busy) return
    const width = 560
    const height = 720
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2)
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2)
    const popup = window.open(
      LOGIN,
      'craftcv-star',
      `popup,width=${width},height=${height},left=${left},top=${top}`,
    )
    // a blocked popup: sign in in this tab, and come back to the home page
    if (!popup) {
      // an API route, not a page, so a full navigation rather than the Next router
      window.location.assign(new URL(`${LOGIN}?mode=page`, window.location.origin))
      return
    }
    setBusy(true)
    const onMessage = (message: MessageEvent) => {
      if (message.origin !== window.location.origin || message.source !== popup) return
      if (message.data?.type !== 'craftcv:star') return
      stopWaiting.current()
      done(message.data.result as Result)
    }
    const timer = window.setInterval(() => popup.closed && stopWaiting.current(), 500)
    stopWaiting.current = () => {
      window.removeEventListener('message', onMessage)
      window.clearInterval(timer)
      setBusy(false)
      stopWaiting.current = () => {}
    }
    window.addEventListener('message', onMessage)
  }

  const count = stars === null ? '' : `, ${stars} stars so far`
  return (
    <a
      className="star-btn"
      href={REPO}
      onClick={star}
      data-starred={starred}
      aria-busy={busy}
      aria-label={
        starred
          ? `You starred CraftCV${count}. Open it on GitHub`
          : `Star CraftCV on GitHub${count}`
      }
    >
      {icons.github}
      <span className="star-btn__label">{starred ? 'Starred' : 'Star'}</span>
      {stars !== null && (
        <span className="star-btn__count">
          {icons.star}
          {short(stars)}
        </span>
      )}
    </a>
  )
}
