import type { HTMLAttributes } from 'react'

/*
 * A loading placeholder for an assistant's reply, modelled on HeroUI Pro's ChatLoader
 * (`@heroui-pro/react`, which this app does not use). Only its dots are needed here.
 */

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
