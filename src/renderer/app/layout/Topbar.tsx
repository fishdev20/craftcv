import { Button, Chip, Separator, Spinner } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import HeaderBreadcrumbs from './HeaderBreadcrumbs'
import ThemeSwitch from './ThemeSwitch'

export default function Topbar({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean
  onToggleSidebar: () => void
}) {
  const busy = useAppStore((s) => s.busy)
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
        <Chip
          size="sm"
          variant="soft"
          color={busy ? 'accent' : 'success'}
          className="local-indicator"
        >
          {busy ? <Spinner aria-hidden="true" size="sm" color="current" /> : <i />}
          {busy ? 'Working on your request' : 'Local workspace'}
        </Chip>
        <ThemeSwitch />
      </div>
    </header>
  )
}
