import { Button, Chip } from '@heroui/react'
import { appApi } from '@/common/api/app-api'
import Loading from '@/common/ui/Loading'
import { Icon } from '@/common/ui/icons'
import { action, useAppStore } from '@/common/store/app-store'
import PanelHeading from '../PanelHeading'
import { goToStep, markApplied } from '../actions'
import { useWorkspaceStore } from '../store'
import ReviewEmptyState from './ReviewEmptyState'
import SessionReview from './SessionReview'

/** Step 5: the press while work runs, then the session's suggestions. */
export default function ReviewPanel() {
  const session = useWorkspaceStore((s) => s.session),
    status = useWorkspaceStore((s) => s.application?.status)
  const busy = useAppStore((s) => s.busy),
    progress = useAppStore((s) => s.progress)
  return (
    <section className="review-panel" aria-labelledby="review-heading">
      <PanelHeading step={5} id="review-heading" title="Review your suggestions">
        {session && !busy && (
          <Chip size="sm" variant="tertiary" className="count-badge">
            {session.suggestions.length}
          </Chip>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="panel-heading-action"
          isDisabled={busy}
          onPress={() => goToStep('projects')}
        >
          <Icon icon="lucide:arrow-left" width={14} />
          Edit projects
        </Button>
        {status === 'preparing' && session && (
          <Button size="sm" isDisabled={busy} onPress={() => void markApplied()}>
            <Icon icon="lucide:send" width={14} />
            Mark as applied
          </Button>
        )}
      </PanelHeading>
      {busy && progress ? (
        <div className="review-loading">
          <Loading
            label={`${progress.phase}${progress.total ? ` · ${progress.files}/${progress.total}` : ''}`}
          />
          <Button variant="outline" size="sm" onPress={() => void action(appApi.cancel)}>
            <Icon icon="lucide:square" width={14} />
            Cancel
          </Button>
        </div>
      ) : session ? (
        <SessionReview key={session.id} session={session} />
      ) : (
        <ReviewEmptyState />
      )}
    </section>
  )
}
