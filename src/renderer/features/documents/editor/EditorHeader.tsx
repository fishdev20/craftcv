import { useState } from 'react'
import { Button, buttonVariants, Input, Link, TextField } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import { exportDocument, saveDocument } from '../actions'
import type { ExportFormat } from '../api'
import { editDraft, type Draft } from '../drafts-store'
import SaveState from './SaveState'

/** Back, the editable title with its save state, and save and export. */
export default function EditorHeader({ draft }: { draft: Draft }) {
  const id = draft.resume.id
  const [exporting, setExporting] = useState(false)
  const exportAs = async (format: ExportFormat) => {
    setExporting(true)
    await exportDocument(id, format)
    setExporting(false)
  }
  return (
    <div className="editor-header">
      <Link
        href="/documents"
        className={buttonVariants({ variant: 'ghost', isIconOnly: true, size: 'sm' })}
        aria-label="Back to documents"
      >
        <Icon icon="lucide:arrow-left" width={18} />
      </Link>
      <TextField
        className="editor-document-title"
        aria-label="Document title"
        value={draft.resume.name}
        maxLength={200}
        onChange={(name) => editDraft(id, { name })}
      >
        <Input variant="secondary" />
        <SaveState draft={draft} />
      </TextField>
      <div className="editor-file-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void saveDocument(id)}
          isDisabled={draft.saving}
        >
          <Icon icon="lucide:save" width={15} />
          {draft.error ? 'Retry save' : 'Save'}
        </Button>
        {(['pdf', 'docx'] as const).map((format) => (
          <Button
            key={format}
            variant="outline"
            size="sm"
            isDisabled={exporting}
            onClick={() => void exportAs(format)}
          >
            <Icon icon="lucide:download" width={14} />
            {format.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  )
}
