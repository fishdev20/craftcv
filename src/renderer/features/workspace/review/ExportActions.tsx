import { useNavigate } from 'react-router'
import { Button } from '@heroui/react'
import type { Session, Suggestion } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import { createDocument } from '@/features/documents/actions'
import { copyApproved, exportSession } from '../actions'

/** What to do with the approved bullets: edit them, copy them, or export a resume. */
export default function ExportActions({
  session,
  approved,
}: {
  session: Session
  approved: Suggestion[]
}) {
  const busy = useAppStore((s) => s.busy)
  const navigate = useNavigate()
  const disabled = !approved.length || busy
  return (
    <div className="export-actions">
      <Button
        variant="outline"
        isDisabled={disabled}
        onClick={() =>
          void createDocument(session.id).then((resume) => {
            if (resume) navigate(`/documents/${resume.id}`)
          })
        }
      >
        <Icon icon="lucide:file-text" width={15} />
        Open in editor
      </Button>
      <Button isDisabled={disabled} onClick={() => void copyApproved(approved)}>
        <Icon icon="lucide:copy" width={15} />
        Copy approved ({approved.length})
      </Button>
      {(['pdf', 'docx'] as const).map((format) => (
        <Button
          variant="outline"
          key={format}
          isDisabled={disabled}
          onClick={() => void exportSession(session.id, format)}
        >
          <Icon icon="lucide:download" width={14} />
          {format.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
