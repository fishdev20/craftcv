import { useEffect, useState } from 'react'

const sidebarKey = 'craftcv-sidebar-collapsed'

/** Whether the sidebar shows icons only, remembered between launches. */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(
    () => window.localStorage.getItem(sidebarKey) === 'true',
  )
  useEffect(() => {
    window.localStorage.setItem(sidebarKey, String(collapsed))
  }, [collapsed])
  return [collapsed, setCollapsed] as const
}
