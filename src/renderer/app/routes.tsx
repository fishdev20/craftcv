import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import Loading from '@/common/ui/Loading'
import WorkspacePage from '@/features/workspace/WorkspacePage'

// the workspace is the first screen; the rest load when first visited
const DocumentsPage = lazy(() => import('@/features/documents/DocumentsPage'))
const DocumentEditorPage = lazy(() => import('@/features/documents/editor/DocumentEditorPage'))
const SourcesPage = lazy(() => import('@/features/library/SourcesPage'))
const ApplicationsPage = lazy(() => import('@/features/applications/ApplicationsPage'))
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage'))

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loading label="Opening workspace…" />}>
      <Routes>
        <Route path="/" element={<WorkspacePage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:id" element={<DocumentEditorPage />} />
        <Route path="/library" element={<SourcesPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  )
}
