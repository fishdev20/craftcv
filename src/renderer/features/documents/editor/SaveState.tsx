import { Description } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import type { Draft } from '../drafts-store'

/** The save status beside the title, announced as it changes. */
export default function SaveState({ draft }: { draft: Draft }) {
  return (
    <Description role="status" className={draft.error ? 'save-state save-error' : 'save-state'}>
      {draft.error ? (
        'Not saved'
      ) : draft.saving ? (
        'Saving…'
      ) : draft.dirty ? (
        'Unsaved changes'
      ) : (
        <>
          <Icon icon="lucide:check" width={13} />
          All changes saved locally
        </>
      )}
    </Description>
  )
}
