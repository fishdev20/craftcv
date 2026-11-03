import { Button, Typography } from '@heroui/react'
import { appApi } from '@/common/api/app-api'
import { Icon } from '@/common/ui/icons'
import { action, useAppStore } from '@/common/store/app-store'
import { importRepositories } from '@/features/projects/actions'
import LibrarySection from './LibrarySection'
import ProjectRow from './ProjectRow'

export default function ProjectsSection() {
  const projects = useAppStore((s) => s.dashboard?.projects),
    busy = useAppStore((s) => s.busy)
  return (
    <LibrarySection
      icon="lucide:folder-git-2"
      title="Projects"
      actions={
        <Button size="sm" isDisabled={busy} onClick={() => void importRepositories('repository')}>
          <Icon icon="lucide:folder-plus" width={15} />
          Import project folder
        </Button>
      }
    >
      {busy && (
        <div className="button-row">
          <Button variant="ghost" onClick={() => void action(appApi.cancel)}>
            Cancel operation
          </Button>
        </div>
      )}
      {!projects?.length && (
        <div className="library-empty">
          <Icon icon="lucide:folder-git-2" width={20} />
          <div>
            <strong>No project folders yet</strong>
            <Typography.Paragraph size="sm">
              Import a Git repository or a parent folder containing service repositories.
            </Typography.Paragraph>
          </div>
        </div>
      )}
      {projects?.map((project) => (
        <ProjectRow key={project.id} project={project} />
      ))}
    </LibrarySection>
  )
}
