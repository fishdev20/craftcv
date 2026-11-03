import { useState } from 'react'
import { Button, Checkbox, Chip, Label, Typography } from '@heroui/react'
import type { Project } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'

/** A selectable project, which expands to show its services and AI understanding. */
export default function ProjectOption({
  project,
  selected,
  isDisabled,
  onSelectedChange,
}: {
  project: Project
  selected: boolean
  isDisabled: boolean
  onSelectedChange: (selected: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const servicesId = `project-services-${project.id}`
  return (
    <div className={`project-selector${selected ? ' selected' : ''}`}>
      <div className="project-selector-heading">
        <Checkbox
          className="project-checkbox"
          isDisabled={isDisabled}
          isSelected={selected}
          onChange={onSelectedChange}
        >
          <Checkbox.Content className="project-choice">
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Icon icon="lucide:git-branch" width={17} />
            <span>
              <span className="project-name-line">
                <Label>{project.name}</Label>
                {project.analysis && (
                  <Chip size="sm" variant="soft" color="accent">
                    <Icon icon="lucide:sparkles" width={11} /> AI understood
                  </Chip>
                )}
              </span>
              <small title={project.rootPath}>
                {project.repositories.length}{' '}
                {project.repositories.length === 1 ? 'repository' : 'services'} · {project.rootPath}
              </small>
            </span>
          </Checkbox.Content>
        </Checkbox>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="project-disclosure"
          aria-expanded={expanded}
          aria-controls={servicesId}
          aria-label={`${expanded ? 'Collapse' : 'Expand'} ${project.name}`}
          onClick={() => setExpanded((value) => !value)}
        >
          <Icon icon="lucide:chevron-down" width={17} />
        </Button>
      </div>
      {expanded && (
        <div className="project-services" id={servicesId}>
          {project.analysis && (
            <div className="project-understanding-summary">
              <span>
                <Icon icon="lucide:sparkles" width={13} /> AI understanding
              </span>
              <Typography.Paragraph size="sm">{project.analysis.summary}</Typography.Paragraph>
              <small>{project.analysis.architecture}</small>
            </div>
          )}
          {project.repositories.map((repository) => (
            <div className="project-service" key={repository.id}>
              <Icon icon="lucide:git-branch" width={13} />
              <span>
                <strong>{repository.name.replace(`${project.name} / `, '')}</strong>
                <small title={repository.path}>{repository.path}</small>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
