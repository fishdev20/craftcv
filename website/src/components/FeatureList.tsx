'use client'

import { useEffect, useRef, useState } from 'react'

export type Feature = { title: string; text: string; shot: React.ReactNode }

/**
 * A numbered list held on the left while the screens scroll past on the right; the item whose
 * screen is in the middle of the view opens, with a bar at its edge.
 */
export function FeatureList({ items }: { items: Feature[] }) {
  const [active, setActive] = useState(0)
  const shots = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index))
        }
      },
      // a thin band across the middle of the screen
      { rootMargin: '-45% 0px -45% 0px' },
    )
    shots.current.forEach((shot) => shot && observer.observe(shot))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="feature-list">
      <ol className="feature-list__list">
        {items.map((item, index) => (
          <li key={item.title} data-active={index === active || undefined}>
            <FeatureText item={item} index={index} />
          </li>
        ))}
      </ol>
      <div className="feature-list__shots">
        {items.map((item, index) => (
          <div
            key={item.title}
            className="feature-list__shot"
            data-index={index}
            ref={(element) => {
              shots.current[index] = element
            }}
          >
            {/* on a phone the words sit above each screen */}
            <div className="feature-list__inline">
              <FeatureText item={item} index={index} />
            </div>
            {item.shot}
          </div>
        ))}
      </div>
    </div>
  )
}

/** A feature's number, title and text, as the list and the phone layout both show them. */
function FeatureText({ item, index }: { item: Feature; index: number }) {
  return (
    <>
      <small>{String(index + 1).padStart(2, '0')}</small>
      <h3>{item.title}</h3>
      <p>{item.text}</p>
    </>
  )
}
