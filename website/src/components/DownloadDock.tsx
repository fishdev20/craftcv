'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useScrollFrame } from '@/lib/use-scroll-frame'
import { loadReleases } from '@/lib/releases'

// scroll distances, in pixels: from the top of the page to the dome's settled state, and over
// which the dome grows again as its place in the page comes up
const SETTLE_DISTANCE = 320
const LANDING_DISTANCE = 360

type Note = 'loading' | 'available' | 'soon' | 'unknown'

const notes: Record<Note, string> = {
  loading: '',
  available: 'Available for macOS and Linux',
  soon: 'Coming soon to macOS and Linux',
  unknown: 'Free and open source',
}

/**
 * The download dome. Over the hero it stands tall: a deep curve, the full-size pill and its note.
 * As the page scrolls on, it settles to a shallow curve at the foot of the screen with only the
 * pill showing; over the last stretch it grows again (--land, 0 to 1), then lets go and rides up
 * with the page, uncovering the footer. The note says whether a build is out yet, from the same
 * GitHub releases the download page reads.
 */
export function DownloadDock({ children }: { children: React.ReactNode }) {
  const dock = useRef<HTMLDivElement>(null)
  const mark = useRef<HTMLSpanElement>(null)
  const [note, setNote] = useState<Note>('loading')

  useEffect(() => {
    let live = true
    loadReleases()
      .then(
        (releases) => live && setNote(releases.some((item) => !item.draft) ? 'available' : 'soon'),
      )
      .catch(() => live && setNote('unknown'))
    return () => {
      live = false
    }
  }, [])

  const updateLanding = useCallback(() => {
    if (!dock.current || !mark.current) return
    // tall at the top of the page, settled once the hero has scrolled a little way
    const atTop = 1 - Math.min(1, window.scrollY / SETTLE_DISTANCE)
    // how far the dome's own place in the page still is below the foot of the screen
    const below = mark.current.getBoundingClientRect().top - window.innerHeight
    const landing = 1 - Math.min(1, Math.max(0, below / LANDING_DISTANCE))
    dock.current.style.setProperty('--land', Math.max(atTop, landing).toFixed(4))
  }, [])
  useScrollFrame(updateLanding)

  return (
    <>
      <div className="dock" ref={dock}>
        {children}
        <span className="dock__note" aria-live="polite">
          {notes[note] || ' '}
        </span>
      </div>
      <span className="dock__mark" ref={mark} aria-hidden="true" />
    </>
  )
}
