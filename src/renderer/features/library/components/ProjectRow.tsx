import { useId, useState } from 'react'
import { Button, Card } from '@heroui/react'
import type { Project } from '@shared/contracts'
import ConfirmRemove from '@/common/ui/ConfirmRemove'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import { removeProject } from '@/features/projects/actions'
import { repositoryTree } from '../repository-tree'
import RepositoryTree from './RepositoryTree'

/** One imported project and the repositories it holds. */
export default function ProjectRow({ project }: { project: Project }) {
  const busy = useAppStore((s) => s.busy)
  const [open, setOpen] = useState(false),
    treeId = useId()
  return (
    <Card className="project-card">
      <Card.Header className="project-card-header">
        <div className="project-card-name">
          <Card.Title>{project.name}</Card.Title>
          {/* the path doubles as the project folder in the tree: it opens the repositories */}
          <Button
            variant="ghost"
            size="sm"
            className="project-card-path"
            aria-expanded={open}
            aria-controls={treeId}
            onPress={() => setOpen((value) => !value)}
          >
            <Icon icon="lucide:chevron-down" width={13} className="project-card-chevron" />
            <Icon icon={open ? 'lucide:folder-open' : 'lucide:folder'} width={13} />
            <span title={project.rootPath}>{project.rootPath}</span>
          </Button>
        </div>
        <ConfirmRemove
          label="Remove project"
          isDisabled={busy}
          onConfirm={() => removeProject(project.id)}
        />
      </Card.Header>

      {open && (
        <nav id={treeId} aria-label="Included repositories" className="project-card-tree">
          <RepositoryTree nodes={repositoryTree(project).children} />
        </nav>
      )}
    </Card>
  )
}
