import { useEffect, useLayoutEffect, useRef } from 'react'
import HL from '@/common/hairline/kernel.js'
import type { HairlineFigure } from '@/common/hairline/figure'
import documents from '@/common/hairline/figures/documents.js'
import cvSheet from '@/common/hairline/figures/cv-sheet.js'
import projectFolder from '@/common/hairline/figures/project-folder.js'
import draftPress from '@/common/hairline/figures/draft-press.js'

type Stage = 'intro' | 'cv' | 'project' | 'ready'

const figures: { stage: Stage; figure: HairlineFigure }[] = [
  { stage: 'intro', figure: documents },
  { stage: 'cv', figure: cvSheet },
  { stage: 'project', figure: projectFolder },
  { stage: 'ready', figure: draftPress },
]

function FigureLayer({ figure, active }: { figure: HairlineFigure; active: boolean }) {
  const stage = useRef<HTMLDivElement>(null)
  const read = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = stage.current
    const label = read.current
    if (!el || !label || typeof IntersectionObserver === 'undefined') return
    HL.inject(document)
    const svg = HL.mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, el)
    const mounted = figure.mount({ stage: el, svg, read: label }, figure.range[1])
    return () => {
      mounted.destroy()
      svg.remove()
    }
  }, [figure])

  useEffect(() => {
    const el = stage.current
    if (
      !active ||
      !el ||
      !figure.tour ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
      return
    const lap = HL.tour(el, figure.tour, () => {})
    return () => lap.stop()
  }, [active, figure])

  return (
    <div
      ref={stage}
      data-hairline={figure.name}
      data-active={active}
      className="onboarding-figure"
      aria-hidden="true"
    >
      <span ref={read} className="sr-only">
        rest
      </span>
    </div>
  )
}

/** One Hairline drawing per onboarding step, with a CSS transition between them. */
export default function OnboardingFigure({ focus }: { focus: Stage }) {
  return (
    <div className="onboarding-art" aria-hidden="true">
      {figures.map(({ stage, figure }) => (
        <FigureLayer key={stage} figure={figure} active={stage === focus} />
      ))}
    </div>
  )
}
