import { Typography } from '@heroui/react'
import type { ReactNode } from 'react'

export default function Page({
  title,
  description,
  actions,
  className,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <main className={className ? `page ${className}` : 'page'}>
      <header className="page-heading">
        <div>
          <Typography.Heading level={1}>{title}</Typography.Heading>
          {description && (
            <Typography.Paragraph size="sm" className="page-description">
              {description}
            </Typography.Paragraph>
          )}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>
      {children}
    </main>
  )
}
