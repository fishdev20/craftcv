import { useState } from 'react'
import { Button, Card, Typography } from '@heroui/react'
import { documentHTML, pageLayout } from '@shared/document'
import { documentTemplates, type DocumentTemplate, type DocumentTemplateId } from '../templates'

function TemplatePreview({ template }: { template: DocumentTemplate }) {
  const document = template.createDocument()
  const layout = pageLayout(document)
  const style = {
    '--margin-top': `${layout.margins[0]}pt`,
    '--margin-right': `${layout.margins[1]}pt`,
    '--margin-bottom': `${layout.margins[2]}pt`,
    '--margin-left': `${layout.margins[3]}pt`,
    '--line-height': layout.lineHeight,
    '--font-size': `${layout.fontSize}pt`,
    '--list-indent': `${layout.listIndent}pt`,
    '--block-space': `${layout.blockSpacing ?? 0}pt`,
  } as React.CSSProperties

  return (
    <div className="document-template-preview" aria-hidden="true">
      <div className="document-template-page">
        <div
          className="document-template-page-content rich-document"
          data-layout={layout.blockSpacing === null ? undefined : 'exact'}
          // documentHTML validates and escapes every hard-coded template node before rendering.
          dangerouslySetInnerHTML={{ __html: documentHTML(document) }}
          style={style}
        />
      </div>
    </div>
  )
}

export default function TemplateGallery({
  onCreate,
}: {
  onCreate: (templateId: DocumentTemplateId) => Promise<void>
}) {
  const [creating, setCreating] = useState<DocumentTemplateId | null>(null)
  const create = async (templateId: DocumentTemplateId) => {
    setCreating(templateId)
    try {
      await onCreate(templateId)
    } finally {
      setCreating(null)
    }
  }

  return (
    <section className="document-templates" aria-labelledby="document-templates-title">
      <div className="document-section-heading">
        <Typography.Heading level={2} id="document-templates-title">
          Start with a template
        </Typography.Heading>
        <Typography.Paragraph size="sm" color="muted">
          Choose a structure, then replace every prompt with your own evidence-backed content.
        </Typography.Paragraph>
      </div>
      <div className="document-template-grid">
        {documentTemplates.map((template) => (
          <Card key={template.id}>
            <TemplatePreview template={template} />
            <Card.Header>
              <Card.Title>{template.name}</Card.Title>
              <Card.Description>{template.description}</Card.Description>
            </Card.Header>
            <Card.Footer>
              <Button
                fullWidth
                aria-label={`Use ${template.name}`}
                isDisabled={creating !== null && creating !== template.id}
                isPending={creating === template.id}
                onPress={() => void create(template.id)}
                variant="outline"
              >
                Use template
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </div>
    </section>
  )
}
