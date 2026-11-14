'use client'

import { useEffect } from 'react'

/**
 * Runs `update` once now and then at most once per animation frame while the page scrolls or
 * resizes. `update` should be stable (defined outside the component, or memoised).
 */
export function useScrollFrame(update: () => void) {
  useEffect(() => {
    let frame = 0
    const run = () => {
      frame = 0
      update()
    }
    const request = () => {
      if (!frame) frame = requestAnimationFrame(run)
    }
    update()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
    }
  }, [update])
}
