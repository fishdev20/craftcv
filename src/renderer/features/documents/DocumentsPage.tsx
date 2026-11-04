import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button, EmptyState, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import Page from '@/common/ui/Page'
import { refreshDashboard, useAppStore } from '@/common/store/app-store'
import { createDocument, createDocumentFromTemplate, importDocument } from './actions'
import DocumentRow from './components/DocumentRow'
import TemplateGallery from './components/TemplateGallery'
import type { DocumentTemplateId } from './templates'

export default function DocumentsPage() {
  const resumes = useAppStore((s) => s.dashboard?.resumes)
  const navigate = useNavigate()
  useEffect(() => {
    void refreshDashboard()
  }, [])
  const open = (resume: { id: string } | null | undefined) => {
    if (resume) navigate(`/documents/${resume.id}`)
  }
  const createBlank = () => void createDocument().then(open)
  const createFromTemplate = async (templateId: DocumentTemplateId) => {
    open(await createDocumentFromTemplate(templateId))
  }
  return (
    <Page
      title="Documents"
      description="Write, format, and export local CV documents."
      actions={
        <>
          <Button variant="outline" onPress={() => void importDocument().then(open)}>
            <Icon icon="lucide:upload" width={16} />
            Import CV
          </Button>
          <Button onPress={createBlank}>
            <Icon icon="lucide:plus" width={16} />
            Blank document
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
