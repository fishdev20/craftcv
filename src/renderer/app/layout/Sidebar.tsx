import { Card, Link, Separator } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import Logo from '@/common/ui/Logo'
import { mainNavigation, settingsNavigation } from '../navigation'
import NavItem from './NavItem'

/** The floating sidebar: detached from the window edge, collapsing to its icons. */
export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  return (
    <aside
      className="sidebar sidebar--floating sidebar--left"
      data-state={collapsed ? 'collapsed' : 'expanded'}
    >
      <Link className="brand" href="/" aria-label={collapsed ? 'CraftCV home' : undefined}>
        <Logo size={30} />
        <span className="brand-name">
          CraftCV
          <span className="brand-version">v{__APP_VERSION__}</span>
        </span>
      </Link>
      <div className="workspace-label">Workspace</div>
      <nav aria-label="Main navigation" className="sidebar-nav">
        {mainNavigation.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Card variant="transparent" className="privacy-note">
          <Icon
            icon="lucide:shield-check"
            width={20}
            role="img"
            aria-label="Local by default"
            aria-hidden={!collapsed}
          />
          <Card.Header>
            <Card.Title>Local by default</Card.Title>
            <Card.Description>
              Your code stays on this device until you choose to share it.
            </Card.Description>
          </Card.Header>
        </Card>
        <Separator />
        <NavItem {...settingsNavigation} collapsed={collapsed} className="nav-link settings-link">
          <Icon icon="lucide:arrow-up-right" width={14} />
        </NavItem>
      </div>
    </aside>
  )
}
