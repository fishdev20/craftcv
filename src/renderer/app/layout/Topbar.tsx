import { Button, Separator } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import HeaderBreadcrumbs from './HeaderBreadcrumbs'
import ThemeSwitch from './ThemeSwitch'

export default function Topbar({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean
  onToggleSidebar: () => void
}) {
  return (
    <header className="topbar">
      <div className="topbar-start">
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-keyshortcuts="Meta+B Control+B"
          aria-expanded={!collapsed}
          onClick={onToggleSidebar}
        >
          <Icon
            icon={collapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'}
            width={18}
          />
        </Button>
        <Separator orientation="vertical" />
        <HeaderBreadcrumbs />
      </div>
      <div className="topbar-actions">
        <ThemeSwitch />
      </div>
    </header>
  )
}
