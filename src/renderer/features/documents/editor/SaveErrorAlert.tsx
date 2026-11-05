import { useNavigate } from 'react-router'
import { Alert, Button } from '@heroui/react'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { saveDocumentCopy } from '../actions'
import type { Draft } from '../drafts-store'

/** Shown when a save fails; the draft stays open, and can be kept as a new document. */
export default function SaveErrorAlert({ draft }: { draft: Draft }) {
  const navigate = useNavigate()
  const { pending, run } = usePendingAction()
  return (
    <Alert status="danger" role="alert" className="editor-save-error">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Description>
          {draft.error} Your draft remains open. Correct the content or title, then retry saving.
        </Alert.Description>
      </Alert.Content>
      <Button
        variant="outline"
        size="sm"
        isPending={pending === 'copy'}
        onClick={() =>
          void run('copy', () => saveDocumentCopy(draft.resume)).then((saved) => {
            if (saved) navigate(`/documents/${saved.id}`)
          })
        }
      >
        {pending === 'copy' ? 'Saving copy…' : 'Save a copy'}
      </Button>
    </Alert>
  )
}
