import { useLayoutEffect, useRef } from 'react'
import HL from '../hairline/kernel.js'
import press from '../hairline/figures/press.js'

/** Hosts the Press figure the way the hairline bench does: one svg, a silent read-out. */
export function PressFigure() {
  const stage = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = stage.current
    // the engine's frame loop sleeps offscreen through IntersectionObserver
    if (!el || typeof IntersectionObserver === 'undefined') return
    HL.inject(document)
    const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, el)
    const figure = press.mount({ stage: el, svg, read: { textContent: null } }, press.range[1])
    return () => {
      figure.destroy()
      svg.remove()
    }
  }, [])
  return <div ref={stage} data-hairline={press.name} className="loading-figure" aria-hidden />
}

export default function Loading({
  label,
  announce = true,
  className,
}: {
  label: string
  announce?: boolean
  className?: string
}) {
  return (
    <div
      className={className ? `loading ${className}` : 'loading'}
      role={announce ? 'status' : undefined}
    >
      <PressFigure />
      <span>{label}</span>
    </div>
  )
}
