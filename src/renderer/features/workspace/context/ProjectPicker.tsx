import { Button, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import { importRepositories } from '@/features/projects/actions'
import { MAX_SELECTED_PROJECTS, toggleProject, useWorkspaceStore } from '../store'
import ProjectOption from './ProjectOption'
import UnderstandSelectedProjects from './UnderstandSelectedProjects'

/** The projects whose code becomes evidence, and the ways to add more. */
export default function ProjectPicker() {
  const projects = useAppStore((s) => s.dashboard?.projects),
    busy = useAppStore((s) => s.busy),
    selected = useWorkspaceStore((s) => s.selected)
  const full = selected.length >= MAX_SELECTED_PROJECTS
  return (
    <div className="input-section">
      <div className="section-title">
        <Typography.Heading level={3}>Projects</Typography.Heading>
        <span>
          {selected.length}/{MAX_SELECTED_PROJECTS} selected
        </span>
      </div>
      {projects?.length === 0 ? (
        <div className="projects-intro">
          <Typography.Paragraph size="sm">
            <strong>No projects yet.</strong> A project is a folder with your code, such as{' '}
            <code>~/code/shop-app</code>. If it holds several repositories, each one counts as a
            service of that project.
          </Typography.Paragraph>
          <Typography.Paragraph size="sm">
            <Icon icon="lucide:shield-check" width={14} />
            CraftCV only reads the folder, on this device. Nothing in it is changed.
          </Typography.Paragraph>
        </div>
      ) : (
        <Typography.Paragraph size="sm" className="field-help">
          Each parent folder is one project. Nested repositories are treated as its services.
        </Typography.Paragraph>
      )}
      {projects?.map((project) => {
        const isSelected = selected.includes(project.id)
        return (
          <ProjectOption
            key={project.id}
            project={project}
            selected={isSelected}
            isDisabled={busy || (!isSelected && full)}
            onSelectedChange={(on) => toggleProject(project.id, on)}
          />
        )
      })}
      <UnderstandSelectedProjects
        projects={projects?.filter((project) => selected.includes(project.id)) ?? []}
      />
      <Button
        variant="outline"
        fullWidth
        isDisabled={busy}
        onClick={() => void importRepositories('repository')}
      >
        <Icon icon="lucide:folder-plus" width={16} />
        Import project folder
      </Button>
    </div>
  )
}
