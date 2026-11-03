import { useEffect } from 'react'
import { RouterProvider } from '@heroui/react'
import { useHref, useNavigate } from 'react-router'
import { appApi } from '@/common/api/app-api'
import { refreshDashboard, setProgress } from '@/common/store/app-store'
import AppShell from './layout/AppShell'
import AppRoutes from './routes'

export default function App() {
  const navigate = useNavigate()
  useEffect(() => {
    void refreshDashboard()
    return appApi.onProgress(setProgress)
  }, [])
  return (
    // HeroUI links and breadcrumbs navigate through react-router
    <RouterProvider navigate={navigate} useHref={useHref}>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </RouterProvider>
  )
}
