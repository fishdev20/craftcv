'use client'

import { useScrollFrame } from '@/lib/use-scroll-frame'

const clamp = (value: number) => Math.min(1, Math.max(0, value))

/** Writes each scene's scroll progress (0 to 1) to its `--p`, unless motion is reduced. */
function updateScenes() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const viewport = window.innerHeight
  for (const scene of document.querySelectorAll<HTMLElement>('[data-scene]')) {
    const { top, height } = scene.getBoundingClientRect()
    const scrollable = scene.dataset.scene === 'pin' ? height - viewport : height
    scene.style.setProperty('--p', clamp(-top / Math.max(1, scrollable)).toFixed(4))
  }
}

/**
 * The page's scroll engine: each `[data-scene]` section gets its progress in `--p`, and the CSS
 * does the rest with calc(), so nothing re-renders as the page scrolls.
 *
 * - `data-scene="pin"`: a tall section with a sticky stage; 0 when it reaches the top, 1 when
 *   its stage is about to leave (the before-and-after).
 * - `data-scene="exit"`: 0 at rest at the top, 1 once the section has scrolled away (the hero).
 *
 * Under reduced motion it writes nothing, so every scene rests on its finished picture.
 */
export function ScrollScenes() {
  useScrollFrame(updateScenes)
  return null
}
