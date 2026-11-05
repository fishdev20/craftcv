import { useNavigate } from 'react-router'
import { Button } from '@heroui/react'
import type { Session, Suggestion } from '@shared/contracts'
import ActionIcon from '@/common/ui/ActionIcon'
import { usePendingAction } from '@/common/ui/usePendingAction'
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
  const { pending, run } = usePendingAction()
  const disabled = !approved.length || busy || pending !== null
  return (
    <div className="export-actions">
      <Button
        variant="outline"
        isPending={pending === 'editor'}
        isDisabled={disabled}
        onClick={() =>
          void run('editor', () => createDocument(session.id)).then((resume) => {
            if (resume) navigate(`/documents/${resume.id}`)
          })
        }
      >
        <ActionIcon pending={pending === 'editor'} icon="lucide:file-text" />
        {pending === 'editor' ? 'Opening editor…' : 'Open in editor'}
      </Button>
      <Button
        isPending={pending === 'copy'}
        isDisabled={disabled}
        onClick={() => void run('copy', () => copyApproved(approved))}
      >
        <ActionIcon pending={pending === 'copy'} icon="lucide:copy" />
        {pending === 'copy' ? 'Copying…' : `Copy approved (${approved.length})`}
      </Button>
      {(['pdf', 'docx'] as const).map((format) => (
        <Button
          variant="outline"
          key={format}
          isPending={pending === format}
          isDisabled={disabled}
          onClick={() => void run(format, () => exportSession(session.id, format))}
        >
          <ActionIcon pending={pending === format} icon="lucide:download" width={14} />
          {pending === format ? `Exporting ${format.toUpperCase()}…` : format.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
