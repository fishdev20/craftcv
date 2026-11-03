import Page from '@/common/ui/Page'
import CvDocumentsSection from './components/CvDocumentsSection'
import ProjectsSection from './components/ProjectsSection'

export default function SourcesPage() {
  return (
    <Page
      title="Sources"
      description="Manage the project folders and CV documents CraftCV can use as evidence."
    >
      <ProjectsSection />
      <CvDocumentsSection />
    </Page>
  )
}
