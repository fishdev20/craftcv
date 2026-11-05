import { Button, Typography } from '@heroui/react'
import { JOB_MIN_LENGTH } from '@shared/job'
import { useAppStore } from '@/common/store/app-store'
import ActionIcon from '@/common/ui/ActionIcon'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { analyze } from '../actions'
import { useWorkspaceStore } from '../store'

/** Starts local analysis; the review step shows its detailed progress. */
export default function AnalyzeFooter() {
  const busy = useAppStore((s) => s.busy)
  const { pending, run } = usePendingAction()
  const ready = useWorkspaceStore(
    (s) => s.selected.length > 0 && s.job.trim().length >= JOB_MIN_LENGTH,
  )
  return (
    <div className="analyze-footer">
      <Button
        fullWidth
        isPending={pending === 'analyze'}
        isDisabled={!ready || busy}
        onClick={() => void run('analyze', analyze)}
      >
        {pending === 'analyze' ? 'Analyzing projects…' : 'Analyze selected projects'}
        <ActionIcon pending={pending === 'analyze'} icon="lucide:arrow-right" width={16} />
      </Button>
      <Typography.Paragraph size="sm">
        Local analysis first. No API key needed.
      </Typography.Paragraph>
    </div>
  )
}
