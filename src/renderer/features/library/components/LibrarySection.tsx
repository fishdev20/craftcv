import { Typography } from '@heroui/react'
import type { ReactNode } from 'react'
import { Icon } from '@/common/ui/icons'

/** A titled list on the library pages, with optional actions beside the title. */
export default function LibrarySection({
  icon,
  title,
  actions,
  children,
}: {
  icon: string
  title: string
  actions?: ReactNode
  children: ReactNode
}) {
  const heading = (
    <Typography.Heading level={2}>
      <Icon icon={icon} width={18} />
      {title}
    </Typography.Heading>
  )
  return (
    <section className="settings-section">
      {actions ? (
        <div className="section-title">
          {heading}
          {actions}
        </div>
      ) : (
        heading
      )}
      {children}
    </section>
  )
}
