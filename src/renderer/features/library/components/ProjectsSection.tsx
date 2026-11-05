import { Button, Typography } from '@heroui/react'
import { appApi } from '@/common/api/app-api'
import ActionIcon from '@/common/ui/ActionIcon'
import { Icon } from '@/common/ui/icons'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { action, useAppStore } from '@/common/store/app-store'
import { importRepositories } from '@/features/projects/actions'
import LibrarySection from './LibrarySection'
import ProjectRow from './ProjectRow'

export default function ProjectsSection() {
  const projects = useAppStore((s) => s.dashboard?.projects),
    busy = useAppStore((s) => s.busy)
  const { pending, run } = usePendingAction()
  return (
    <LibrarySection
      icon="lucide:folder-git-2"
      title="Projects"
      actions={
        <Button
          size="sm"
          isPending={pending === 'import'}
          isDisabled={busy}
          onClick={() => void run('import', () => importRepositories('repository'))}
        >
          <ActionIcon pending={pending === 'import'} icon="lucide:folder-plus" />
          {pending === 'import' ? 'Importing folder…' : 'Import project folder'}
        </Button>
      }
    >
      {pending === 'import' && (
        <div className="button-row" role="status">
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
