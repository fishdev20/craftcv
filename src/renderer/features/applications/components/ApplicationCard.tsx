import { Chip, Spinner } from '@heroui/react'
import type { ApplicationSummary } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import { STEP_LABELS, day } from '../meta'
import ApplicationActions from './ApplicationActions'

/**
 * What a board card shows: the role, where it stands, and what to do next. Its menu also
 * moves it, for those not dragging.
 */
export default function ApplicationCard({
  application,
  pending,
}: {
  application: ApplicationSummary
  pending?: string | null
}) {
  const resumeName = useAppStore(
    (s) => s.dashboard?.resumes.find((resume) => resume.id === application.resumeId)?.name,
  )
  return (
    <div className="application-card">
      <div className="application-card-head">
        <strong>{application.role || 'Untitled role'}</strong>
        <span>
          {[application.company, application.location].filter(Boolean).join(' · ') ||
            'Company not set'}
        </span>
      </div>
      <div className="application-card-meta">
        {application.status === 'preparing' ? (
          <Chip size="sm" variant="soft">
            <Icon icon="lucide:pencil-line" width={12} />
            {STEP_LABELS[application.step]}
          </Chip>
        ) : (
          application.appliedAt && (
            <span>
              <Icon icon="lucide:calendar" width={12} />
              Applied {day(application.appliedAt)}
            </span>
          )
        )}
        {resumeName && (
          <span title={resumeName}>
            <Icon icon="lucide:file-text" width={12} />
            {resumeName}
          </span>
        )}
      </div>
      <div className="application-card-footer">
        {pending ? (
          <span className="application-card-pending" role="status">
            <Spinner aria-hidden="true" size="sm" />
            {pending === 'move' ? 'Moving…' : 'Opening…'}
          </span>
        ) : (
          <span className="application-updated">Updated {day(application.updatedAt)}</span>
        )}
        <ApplicationActions application={application} withMoves />
      </div>
    </div>
  )
}
