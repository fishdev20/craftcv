import { Button, buttonVariants, Input, Link, TextField } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import ActionIcon from '@/common/ui/ActionIcon'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { exportDocument, saveDocument } from '../actions'
import type { ExportFormat } from '../api'
import { editDraft, type Draft } from '../drafts-store'
import SaveState from './SaveState'

/** Back, the editable title with its save state, and save and export. */
export default function EditorHeader({ draft }: { draft: Draft }) {
  const id = draft.resume.id
  const { pending, run } = usePendingAction()
  const exportAs = (format: ExportFormat) => run(format, () => exportDocument(id, format))
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
          onClick={() => void run('save', () => saveDocument(id))}
          isPending={pending === 'save'}
          isDisabled={draft.saving || pending !== null}
        >
          <ActionIcon pending={pending === 'save'} icon="lucide:save" />
          {pending === 'save' ? 'Saving…' : draft.error ? 'Retry save' : 'Save'}
        </Button>
        {(['pdf', 'docx'] as const).map((format) => (
          <Button
            key={format}
            variant="outline"
            size="sm"
            isPending={pending === format}
            isDisabled={pending !== null}
            onClick={() => void exportAs(format)}
          >
            <ActionIcon pending={pending === format} icon="lucide:download" width={14} />
            {pending === format ? `Exporting ${format.toUpperCase()}…` : format.toUpperCase()}
          </Button>
        ))}
      </div>
    </div>
  )
}
