import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Button, EmptyState, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import Page from '@/common/ui/Page'
import { refreshDashboard, useAppStore } from '@/common/store/app-store'
import { createDocument, importDocument } from './actions'
import DocumentRow from './components/DocumentRow'

export default function DocumentsPage() {
  const resumes = useAppStore((s) => s.dashboard?.resumes)
  const navigate = useNavigate()
  useEffect(() => {
    void refreshDashboard()
  }, [])
  const open = (resume: { id: string } | null | undefined) => {
    if (resume) navigate(`/documents/${resume.id}`)
  }
  const create = () => void createDocument().then(open)
  return (
    <Page
      title="Documents"
      description="Write, format, and export local CV documents."
      actions={
        <Button onClick={create}>
          <Icon icon="lucide:plus" width={16} />
          New document
        </Button>
      }
    >
      <div className="document-list-tools">
        <Button variant="outline" onClick={() => void importDocument().then(open)}>
          <Icon icon="lucide:upload" width={16} />
          Import CV
        </Button>
        <Typography.Paragraph size="sm">
          Imports begin with extracted text. Add formatting in the editor.
        </Typography.Paragraph>
      </div>
      <section aria-label="Resume documents" className="document-list">
        {!resumes?.length ? (
          <EmptyState className="document-list-empty">
            <Icon icon="lucide:file-text" width={32} />
            <Typography.Heading level={2}>A place for your next application.</Typography.Heading>
            <Typography.Paragraph size="sm">
              Create a blank document, import a CV, or open approved suggestions in the editor.
            </Typography.Paragraph>
            <Button onClick={create}>Create your first document</Button>
          </EmptyState>
        ) : (
          resumes.map((resume) => <DocumentRow key={resume.id} id={resume.id} name={resume.name} />)
        )}
      </section>
    </Page>
  )
}
