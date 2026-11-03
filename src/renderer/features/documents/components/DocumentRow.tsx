import { Link } from '@heroui/react'
import ConfirmRemove from '@/common/ui/ConfirmRemove'
import { Icon } from '@/common/ui/icons'
import { removeDocument } from '../actions'
import { useDocuments } from '../drafts-store'

/** One document in the list; an open draft's name and save state win over the saved ones. */
export default function DocumentRow({ id, name }: { id: string; name: string }) {
  const draft = useDocuments((s) => s.drafts[id])
  return (
    <article className="document-list-row">
      <Icon icon="lucide:file-text" width={24} />
      <Link href={`/documents/${id}`}>
        <strong>{draft?.resume.name ?? name}</strong>
        <small>{draft?.dirty ? 'Unsaved changes' : 'Saved locally'} · Resume document</small>
      </Link>
      <ConfirmRemove
        label={`Delete ${name}`}
        confirmLabel="Delete document"
        keepLabel="Keep document"
        isDisabled={draft?.saving}
        onConfirm={() => removeDocument(id)}
      />
    </article>
  )
}
