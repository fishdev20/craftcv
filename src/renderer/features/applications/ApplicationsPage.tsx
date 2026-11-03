import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, EmptyState, ToggleButton, ToggleButtonGroup, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import Page from '@/common/ui/Page'
import { useAppStore } from '@/common/store/app-store'
import SetupChecklist from '@/features/onboarding/SetupChecklist'
import { startOver } from '@/features/workspace/store'
import ApplicationBoard from './components/ApplicationBoard'
import ApplicationTable from './components/ApplicationTable'
import EarlierAnalyses from './components/EarlierAnalyses'

type View = 'list' | 'board'
const viewKey = 'craftcv-applications-view'

// which view this device last used; the list when storage is unavailable
function savedView(): View {
  try {
    return window.localStorage.getItem(viewKey) === 'board' ? 'board' : 'list'
  } catch {
    return 'list'
  }
}

/** The tracker: every application as a list or a board by status, created as the new-application flow runs. */
export default function ApplicationsPage() {
  const applications = useAppStore((s) => s.dashboard?.applications)
  const navigate = useNavigate()
  const [view, setView] = useState<View>(savedView)
  const choose = (next: View) => {
    setView(next)
    try {
      window.localStorage.setItem(viewKey, next)
    } catch {
      // kept for this visit only
    }
  }
  const start = () => {
    startOver()
    navigate('/')
  }
  return (
    <Page
      title="Applications"
      description="Each job you prepare a CV for appears here. Move it along as you hear back."
      actions={
        <>
          {applications?.length ? (
            <ToggleButtonGroup
              size="sm"
              aria-label="View"
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={[view]}
              onSelectionChange={(keys) => {
                const [next] = [...keys]
                if (next === 'list' || next === 'board') choose(next)
              }}
            >
              <ToggleButton id="list">
                <Icon icon="lucide:list" width={14} />
                List
              </ToggleButton>
              <ToggleButton id="board">
                <Icon icon="lucide:kanban" width={14} />
                Board
              </ToggleButton>
            </ToggleButtonGroup>
          ) : null}
          <Button size="sm" onPress={start}>
            <Icon icon="lucide:plus" width={14} />
            New application
          </Button>
        </>
      }
    >
      {applications && !applications.length ? (
        <>
          <SetupChecklist onStart={start} />
          <EmptyState className="applications-empty">
            <Icon icon="lucide:kanban" width={30} />
            <Typography.Heading level={3}>No applications yet</Typography.Heading>
            <Typography.Paragraph size="sm">
              Start one by adding a job. It appears here as you prepare it.
            </Typography.Paragraph>
            <Button onPress={start}>Start an application</Button>
          </EmptyState>
        </>
      ) : applications && view === 'list' ? (
        <ApplicationTable applications={applications} />
      ) : (
        <ApplicationBoard applications={applications ?? []} />
      )}
      <EarlierAnalyses />
    </Page>
  )
}
