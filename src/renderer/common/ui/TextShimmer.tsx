import type { HTMLAttributes } from 'react'

/* A progress label that keeps the inherited text colour and respects reduced motion. */
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
