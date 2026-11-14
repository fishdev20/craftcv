'use client'

import Lenis from 'lenis'
import { useEffect } from 'react'

/**
 * Eased, momentum-style page scrolling (Lenis). It still moves the window itself, so the sticky
 * scenes and `ScrollScenes` work as before; in-page anchor links glide to their section. It
 * pauses while the nav menu locks the page, and stays off under reduced motion.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, anchors: true, lerp: 0.09 })
    const root = document.documentElement
    // the nav menu locks the page by hiding <html>'s overflow
    const lock = new MutationObserver(() => {
      if (root.style.overflow === 'hidden') lenis.stop()
      else lenis.start()
    })
    lock.observe(root, { attributes: true, attributeFilter: ['style'] })
    return () => {
      lock.disconnect()
      lenis.destroy()
    }
  }, [])
  return null
}
