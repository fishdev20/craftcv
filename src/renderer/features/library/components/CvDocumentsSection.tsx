import { Button, Link, Typography } from '@heroui/react'
import ConfirmRemove from '@/common/ui/ConfirmRemove'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import { importDocument, removeDocument } from '@/features/documents/actions'
import LibrarySection from './LibrarySection'
import ResumePreview from './ResumePreview'

export default function CvDocumentsSection() {
  const resumes = useAppStore((s) => s.dashboard?.resumes),
    busy = useAppStore((s) => s.busy)
  return (
    <LibrarySection
      icon="lucide:file-text"
      title="CV documents"
      actions={
        <Button variant="outline" size="sm" isDisabled={busy} onClick={() => void importDocument()}>
          <Icon icon="lucide:upload" width={15} />
          Import CV
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
