import { Button, Description, Dropdown, Label } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import type { DocumentTemplateId } from '../templates'
import { documentTemplates } from '../templates'

type NewDocumentChoice = 'blank' | DocumentTemplateId

export default function NewDocumentMenu({
  label = 'New document',
  onCreate,
}: {
  label?: string
  onCreate: (choice: NewDocumentChoice) => void
}) {
  return (
    <Dropdown>
      <Button aria-label={label}>
        <Icon icon="lucide:plus" width={16} />
        {label}
        <Icon icon="lucide:chevron-down" width={14} />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={(key) => onCreate(String(key) as NewDocumentChoice)}>
          <Dropdown.Item id="blank" textValue="Blank document">
            <Label>Blank document</Label>
            <Description>Start with an empty page.</Description>
          </Dropdown.Item>
          {documentTemplates.map((template) => (
            <Dropdown.Item key={template.id} id={template.id} textValue={template.name}>
              <Label>{template.name}</Label>
              <Description>{template.description}</Description>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
