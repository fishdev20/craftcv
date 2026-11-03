import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Button, CloseButton, ProgressBar, Typography } from '@heroui/react'
import { useAppStore } from '@/common/store/app-store'
import { Icon } from '@/common/ui/icons'
import { importRepositories } from '@/features/projects/actions'
import { importCv, startBlankCv } from '@/features/workspace/actions'
import { hideSetup, setupProgress, useOnboardingStore, type SetupItem } from './onboarding'

type Item = { id: SetupItem; title: string; help: string; optional?: boolean; action?: ReactNode }

/**
 * What a good first result needs, ticked off from what is saved. It hides itself once
 * everything is done, or when closed.
 */
export default function SetupChecklist({ onStart }: { onStart?: () => void }) {
  const dashboard = useAppStore((s) => s.dashboard),
    busy = useAppStore((s) => s.busy),
    hidden = useOnboardingStore((s) => s.setupHidden)
  const navigate = useNavigate()
  if (!dashboard || hidden) return null
  const done = setupProgress(dashboard)
  const items: Item[] = [
    {
      id: 'cv',
      title: 'Add your CV',
      help: 'A PDF or Word file keeps its layout and pages.',
      action: (
        <>
          <Button size="sm" variant="secondary" isDisabled={busy} onPress={() => void importCv()}>
            <Icon icon="lucide:upload" width={14} />
            Import
          </Button>
          <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => void startBlankCv()}>
            Start blank
          </Button>
        </>
      ),
    },
    {
      id: 'project',
      title: 'Add a project folder',
      help: 'A folder with your code. Repositories inside it count as its services.',
      action: (
        <Button
          size="sm"
          variant="secondary"
          isDisabled={busy}
          onPress={() => void importRepositories('repository')}
        >
          <Icon icon="lucide:folder-plus" width={14} />
          Add folder
        </Button>
      ),
    },
    {
      id: 'ai',
      title: 'Connect AI',
      optional: true,
      help: 'For fuller job analysis and tailoring. Reading jobs and projects works without it.',
      action: (
        <Button size="sm" variant="ghost" isDisabled={busy} onPress={() => navigate('/settings')}>
          <Icon icon="lucide:settings" width={14} />
          Settings
        </Button>
      ),
    },
    {
      id: 'application',
      title: 'Start your first application',
      help: 'Add a job and CraftCV takes you through the rest.',
      action: onStart && (
        <Button size="sm" variant="secondary" isDisabled={busy} onPress={onStart}>
          Start
        </Button>
      ),
    },
  ]
  const count = items.filter((item) => done[item.id]).length
  if (count === items.length) return null
  return (
    <section className="setup-checklist" aria-labelledby="setup-heading">
      <div className="setup-header">
        <div>
          <Typography.Heading level={2} id="setup-heading">
            Set up CraftCV
          </Typography.Heading>
          <Typography.Paragraph size="sm">
            {count} of {items.length} done
          </Typography.Paragraph>
        </div>
        <CloseButton aria-label="Hide setup" onPress={hideSetup} />
      </div>
      <ProgressBar aria-label="Setup progress" value={count} maxValue={items.length} size="sm">
        <ProgressBar.Track>
          <ProgressBar.Fill />
        </ProgressBar.Track>
      </ProgressBar>
      <ol className="setup-items">
        {items.map((item) => (
          <li key={item.id} data-done={done[item.id] || undefined}>
            <Icon
              icon={done[item.id] ? 'lucide:circle-check' : 'lucide:circle-dashed'}
              width={18}
              className="setup-mark"
            />
            <span className="setup-text">
              <strong>
                {item.title}
                {item.optional && <small>Optional</small>}
              </strong>
              {!done[item.id] && <span>{item.help}</span>}
            </span>
            {!done[item.id] && item.action && <span className="setup-action">{item.action}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}
