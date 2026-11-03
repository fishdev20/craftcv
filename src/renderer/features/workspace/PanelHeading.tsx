import { Typography } from '@heroui/react'
import type { ReactNode } from 'react'

/** A numbered workflow step's heading. */
export default function PanelHeading({
  step,
  id,
  title,
  children,
}: {
  step: number
  id: string
  title: string
  children?: ReactNode
}) {
  return (
    <div className="panel-heading">
      <span className="step-number">{step}</span>
      <Typography.Heading level={2} id={id}>
        {title}
      </Typography.Heading>
      {children}
    </div>
  )
}
