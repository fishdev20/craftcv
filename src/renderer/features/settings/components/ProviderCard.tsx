import type { ReactNode } from 'react'
import { Card, Chip } from '@heroui/react'
import { Icon } from '@/common/ui/icons'

/** The provider's connection state, as a dot and a word. */
export function Status({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <Chip size="sm" variant="soft" color={on ? 'success' : 'default'} className="provider-status">
      <span className="status-dot" data-on={on || undefined} />
      {children}
    </Chip>
  )
}

/** A provider: its mark, name and kind, its status, and whatever it needs to connect. */
export default function ProviderCard({
  logo,
  name,
  kind,
  status,
  children,
}: {
  logo: string
  name: string
  kind: string
  status: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="provider-card">
      <Card.Header className="provider-card-header">
        <span className="provider-logo">
          <Icon icon={logo} width={22} />
        </span>
        <div className="provider-name">
          <Card.Title>{name}</Card.Title>
          <Card.Description>{kind}</Card.Description>
        </div>
        {status}
      </Card.Header>
      <Card.Content className="provider-card-content">{children}</Card.Content>
    </Card>
  )
}
