import { Breadcrumbs } from '@heroui/react'
import { useLocation } from 'react-router'
import { useDocuments } from '@/features/documents/drafts-store'
import { sectionTitles } from '../navigation'

/** Where you are, from the route; an open document shows its current title. */
export default function HeaderBreadcrumbs() {
  const { pathname } = useLocation()
  const [section, id] = pathname.split('/').filter(Boolean)
  const documentName = useDocuments((s) => (id ? s.drafts[id]?.resume.name : undefined))
  const crumbs: { label: string; href?: string }[] = [{ label: 'Workspace', href: '/' }]
  if (!section) crumbs.push({ label: 'New application' })
  else if (section === 'documents' && id)
    crumbs.push({ label: 'Documents', href: '/documents' }, { label: documentName || 'Document' })
  else crumbs.push({ label: sectionTitles[section] ?? 'Page' })
  return (
    <nav aria-label="Breadcrumb" className="topbar-breadcrumbs">
      <Breadcrumbs>
        {crumbs.map((crumb) => (
          <Breadcrumbs.Item key={crumb.label} href={crumb.href}>
            {crumb.label}
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs>
    </nav>
  )
}
