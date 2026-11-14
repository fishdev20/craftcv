import { useEffect } from 'react'
import { RouterProvider } from '@heroui/react'
import { useHref, useNavigate } from 'react-router'
import { appApi } from '@/common/api/app-api'
import { refreshDashboard, setProgress, useAppStore } from '@/common/store/app-store'
import Welcome from '@/features/onboarding/Welcome'
import { shouldWelcome, useOnboardingStore } from '@/features/onboarding/onboarding'
import AppShell from './layout/AppShell'
import Toasts from './layout/Toasts'
import AppRoutes from './routes'

export default function App() {
  const navigate = useNavigate()
  const dashboard = useAppStore((s) => s.dashboard)
  const welcomed = useOnboardingStore((s) => s.welcomed)
  const forceShow = useOnboardingStore((s) => s.forceShow)
  useEffect(() => {
    void refreshDashboard()
    return appApi.onProgress(setProgress)
  }, [])
  return (
    // HeroUI links and breadcrumbs navigate through react-router
    <RouterProvider navigate={navigate} useHref={useHref}>
      {shouldWelcome(dashboard, welcomed, forceShow) ? (
        <>
          <Welcome />
          <Toasts />
        </>
      ) : (
        <AppShell>
          <AppRoutes />
        </AppShell>
      )}
    </RouterProvider>
  )
}
