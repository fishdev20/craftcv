import type { HTMLAttributes } from 'react'

/*
 * A label with light sweeping across it, for work in progress; modelled on HeroUI Pro's
 * TextShimmer (`@heroui-pro/react`, which this app does not use). It takes the text colour,
 * so `color` classes keep it visible; with reduced motion it is plain text.
 */
export default function TextShimmer({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props} className={['text-shimmer', className].filter(Boolean).join(' ')}>
      <span className="text-shimmer__text">{children}</span>
      <span className="text-shimmer__highlight" aria-hidden="true">
        {children}
      </span>
    </span>
  )
}
