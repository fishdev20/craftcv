import { Button, ProgressBar, Typography } from '@heroui/react'
import { JOB_MIN_LENGTH } from '@shared/job'
import { appApi } from '@/common/api/app-api'
import { Icon } from '@/common/ui/icons'
import { action, useAppStore } from '@/common/store/app-store'
import { analyze } from '../actions'
import { useWorkspaceStore } from '../store'

/** Starts the local analysis; while anything runs, shows its progress and a cancel. */
export default function AnalyzeFooter() {
  const busy = useAppStore((s) => s.busy),
    progress = useAppStore((s) => s.progress)
  const ready = useWorkspaceStore(
    (s) => s.selected.length > 0 && s.job.trim().length >= JOB_MIN_LENGTH,
  )
  return (
    <div className="analyze-footer">
      {busy ? (
        <>
          <ProgressBar
            aria-label={progress?.phase ?? 'Working'}
            isIndeterminate={!progress?.total}
            value={progress?.total ? (progress.files / progress.total) * 100 : undefined}
            size="sm"
          >
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
          <div className="progress-line" role="status">
            {progress?.phase ?? 'Working…'}
            {progress?.total ? ` · ${progress.files}/${progress.total}` : ''}
          </div>
          <Button variant="outline" fullWidth onClick={() => void action(appApi.cancel)}>
            <Icon icon="lucide:square" width={14} />
            Cancel operation
          </Button>
        </>
      ) : (
        <Button fullWidth isDisabled={!ready} onClick={() => void analyze()}>
          Analyze selected projects
          <Icon icon="lucide:arrow-right" width={16} />
        </Button>
      )}
      <Typography.Paragraph size="sm">
        Local analysis first. No API key needed.
      </Typography.Paragraph>
    </div>
  )
}
