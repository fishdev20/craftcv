import type { ReactNode } from 'react'
import { Link, Tooltip } from '@heroui/react'
import { useMatch } from 'react-router'
import { Icon } from '@/common/ui/icons'

/** A sidebar link; collapsed, its label moves into a tooltip and stays its accessible name. */
export default function NavItem({
  to,
  end = false,
  icon,
  label,
  collapsed,
  className = 'nav-link',
  children,
}: {
  to: string
  end?: boolean
  icon: string
  label: string
  collapsed: boolean
  className?: string
  children?: ReactNode
}) {
  const current = useMatch({ path: to, end })
  return (
    <Tooltip delay={300} closeDelay={0} isDisabled={!collapsed}>
      <Link href={to} className={className} aria-current={current ? 'page' : undefined}>
        <Icon icon={icon} width={18} />
        <span className="nav-label">{label}</span>
        {children}
      </Link>
      <Tooltip.Content placement="right">{label}</Tooltip.Content>
    </Tooltip>
  )
}
