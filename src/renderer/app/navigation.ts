/** The app's sections: the sidebar lists them and the breadcrumbs name them. */
export const mainNavigation = [
  { to: '/', end: true, icon: 'lucide:sparkles', label: 'New application' },
  { to: '/applications', icon: 'lucide:kanban', label: 'Applications' },
  { to: '/documents', icon: 'lucide:file-text', label: 'Documents' },
  { to: '/library', icon: 'lucide:folder-git-2', label: 'Your sources' },
]
export const settingsNavigation = { to: '/settings', icon: 'lucide:settings', label: 'Settings' }

/** The breadcrumb name of a top-level section; the workspace itself is a new application. */
export const sectionTitles: Record<string, string> = {
  documents: 'Documents',
  library: 'Your sources',
  applications: 'Applications',
  settings: 'Settings',
}
