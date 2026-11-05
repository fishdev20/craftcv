import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button, EmptyState, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import ActionIcon from '@/common/ui/ActionIcon'
import Page from '@/common/ui/Page'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { refreshDashboard, useAppStore } from '@/common/store/app-store'
import { createDocument, createDocumentFromTemplate, importDocument } from './actions'
import DocumentRow from './components/DocumentRow'
import TemplateGallery from './components/TemplateGallery'
import type { DocumentTemplateId } from './templates'

export default function DocumentsPage() {
  const resumes = useAppStore((s) => s.dashboard?.resumes)
  const navigate = useNavigate()
  const { pending, run } = usePendingAction()
  useEffect(() => {
    void refreshDashboard()
  }, [])
  const open = (resume: { id: string } | null | undefined) => {
    if (resume) navigate(`/documents/${resume.id}`)
  }
  const createBlank = () => void run('blank', createDocument).then(open)
  const createFromTemplate = async (templateId: DocumentTemplateId) => {
    open(await createDocumentFromTemplate(templateId))
  }
  return (
    <Page
      title="Documents"
      description="Write, format, and export local CV documents."
      actions={
        <>
          <Button
            variant="outline"
            isPending={pending === 'import'}
            isDisabled={pending !== null}
            onPress={() => void run('import', importDocument).then(open)}
          >
            <ActionIcon pending={pending === 'import'} icon="lucide:upload" width={16} />
            {pending === 'import' ? 'Importing…' : 'Import CV'}
          </Button>
          <Button
            isPending={pending === 'blank'}
            isDisabled={pending !== null}
            onPress={createBlank}
          >
            <ActionIcon pending={pending === 'blank'} icon="lucide:plus" width={16} />
            {pending === 'blank' ? 'Creating…' : 'Blank document'}
          </Button>
        </>
      }
    >
      <TemplateGallery onCreate={createFromTemplate} />
      <div className="document-section-heading document-section-heading--saved">
        <Typography.Heading level={2}>Your documents</Typography.Heading>
        <Typography.Paragraph size="sm" color="muted">
          Imported and edited CVs stay on this device.
        </Typography.Paragraph>
      </div>
      <section aria-label="Resume documents" className="document-list">
        {!resumes?.length ? (
          <EmptyState className="document-list-empty">
            <Icon icon="lucide:file-text" width={32} />
            <Typography.Heading level={2}>A place for your next application.</Typography.Heading>
            <Typography.Paragraph size="sm">
              Choose a template above, import a CV, or start with a blank document.
            </Typography.Paragraph>
          </EmptyState>
        ) : (
          resumes.map((resume) => <DocumentRow key={resume.id} id={resume.id} name={resume.name} />)
        )}
      </section>
    </Page>
  )
}
