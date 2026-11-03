import { useNavigate } from 'react-router'
import { Alert, Button } from '@heroui/react'
import { saveDocumentCopy } from '../actions'
import type { Draft } from '../drafts-store'

/** Shown when a save fails; the draft stays open, and can be kept as a new document. */
export default function SaveErrorAlert({ draft }: { draft: Draft }) {
  const navigate = useNavigate()
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
        onClick={() =>
          void saveDocumentCopy(draft.resume).then((saved) => {
            if (saved) navigate(`/documents/${saved.id}`)
          })
        }
      >
        Save a copy
      </Button>
    </Alert>
  )
}
