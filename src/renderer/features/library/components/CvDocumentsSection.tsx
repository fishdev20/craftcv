import { Button, Link, Typography } from '@heroui/react'
import ConfirmRemove from '@/common/ui/ConfirmRemove'
import ActionIcon from '@/common/ui/ActionIcon'
import { Icon } from '@/common/ui/icons'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { useAppStore } from '@/common/store/app-store'
import { importDocument, removeDocument } from '@/features/documents/actions'
import LibrarySection from './LibrarySection'
import ResumePreview from './ResumePreview'

export default function CvDocumentsSection() {
  const resumes = useAppStore((s) => s.dashboard?.resumes),
    busy = useAppStore((s) => s.busy)
  const { pending, run } = usePendingAction()
  return (
    <LibrarySection
      icon="lucide:file-text"
      title="CV documents"
      actions={
        <Button
          variant="outline"
          size="sm"
          isPending={pending === 'import'}
          isDisabled={busy}
          onClick={() => void run('import', importDocument)}
        >
          <ActionIcon pending={pending === 'import'} icon="lucide:upload" />
          {pending === 'import' ? 'Importing…' : 'Import CV'}
        </Button>
      }
    >
      {!resumes?.length && (
        <div className="library-empty">
          <Icon icon="lucide:file-text" width={20} />
          <div>
            <strong>No CV documents yet</strong>
            <Typography.Paragraph size="sm">
              Import one for tailoring, or create a document from approved suggestions later.
            </Typography.Paragraph>
          </div>
        </div>
      )}
      {resumes?.map((r) => (
        <div className="library-row" key={r.id}>
          <ResumePreview id={r.id} name={r.name} />
          <Link href={`/documents/${r.id}`}>Edit document</Link>
          <ConfirmRemove
            label="Remove resume"
            isDisabled={busy}
            onConfirm={() => removeDocument(r.id)}
          />
        </div>
      ))}
    </LibrarySection>
  )
}
