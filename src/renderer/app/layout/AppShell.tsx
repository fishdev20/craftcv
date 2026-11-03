import { useEffect, type ReactNode } from 'react'
import { useSidebarCollapsed } from '../useSidebarCollapsed'
import Sidebar from './Sidebar'
import Toasts from './Toasts'
import Topbar from './Topbar'

/** Typing somewhere ⌘B means something else, such as bold in the document editor. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

export default function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useSidebarCollapsed()
  // ⌘B (Ctrl+B elsewhere) shows or hides the sidebar's labels, as in HeroUI Pro's layout
  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== 'b' ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.shiftKey ||
        isTyping(event.target)
      )
        return
      event.preventDefault()
      setCollapsed((value) => !value)
    }
    window.addEventListener('keydown', toggle)
    return () => window.removeEventListener('keydown', toggle)
  }, [setCollapsed])
  return (
    <div className="app-shell" data-collapsed={collapsed || undefined}>
      <Sidebar collapsed={collapsed} />
      <div className="app-body">
        <Topbar collapsed={collapsed} onToggleSidebar={() => setCollapsed((value) => !value)} />
        {children}
      </div>
      <Toasts />
    </div>
  )
}
