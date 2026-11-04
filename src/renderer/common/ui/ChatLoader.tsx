import type { HTMLAttributes } from 'react'

/* A minimal, decorative three-dot loading indicator. */

function Dots({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={['chat-loader chat-loader--dots', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      <span />
      <span />
      <span />
    </div>
  )
}

export const ChatLoader = { Dots }
