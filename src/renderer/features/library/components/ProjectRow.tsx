import { useId, useState } from 'react'
import { Button, Card, Chip, Typography } from '@heroui/react'
import type { Project } from '@shared/contracts'
import ConfirmRemove from '@/common/ui/ConfirmRemove'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import { removeProject } from '@/features/projects/actions'
import ProjectUnderstanding from '@/features/projects/components/ProjectUnderstanding'
import { repositoryTree } from '../repository-tree'
import RepositoryTree from './RepositoryTree'

/** One imported project: what it is, the repositories it holds, and what AI made of it. */
export default function ProjectRow({ project }: { project: Project }) {
  const busy = useAppStore((s) => s.busy)
  const { analysis } = project
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
        <Chip
          size="sm"
          variant="soft"
          color={analysis ? 'success' : 'default'}
          className="project-card-status"
        >
          <Icon icon={analysis ? 'lucide:sparkles' : 'lucide:circle-dashed'} width={12} />
          {analysis ? 'Understood' : 'Not analysed'}
        </Chip>
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

      {analysis && (
        <Card.Content className="project-card-content">
          <div className="project-card-summary">
            <Typography.Paragraph size="sm">{analysis.summary}</Typography.Paragraph>
            {analysis.technologies.length > 0 && (
              <div className="project-card-tags" aria-label="Technologies">
                {analysis.technologies.map((technology) => (
                  <Chip key={technology} size="sm" variant="secondary">
                    {technology}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        </Card.Content>
      )}

      <Card.Footer className="project-card-footer">
        <ProjectUnderstanding project={project} />
      </Card.Footer>
    </Card>
  )
}
