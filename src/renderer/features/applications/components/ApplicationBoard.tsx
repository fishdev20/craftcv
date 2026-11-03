import { useNavigate } from 'react-router'
import { Button } from '@heroui/react'
import {
  applicationStatusSchema,
  type ApplicationStatus,
  type ApplicationSummary,
} from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import { Kanban, useKanbanColumn } from '@/common/ui/Kanban'
import { useAppStore } from '@/common/store/app-store'
import { openApplication } from '@/features/workspace/actions'
import { startOver } from '@/features/workspace/store'
import { STATUS_LABELS, setApplicationStatus } from '../actions'
import { DRAG_TYPE, STATUS_ICONS } from '../meta'
import ApplicationCard from './ApplicationCard'

const EMPTY: Record<ApplicationStatus, string> = {
  preparing: 'Applications you are preparing',
  applied: 'Drop an application here once it is sent',
  interviewing: 'Drop here when you hear back',
  offer: 'Drop here when an offer comes',
  closed: 'Finished and declined applications',
}

/** One column per status, as a project board; a card dropped on a column moves it there. */
export default function ApplicationBoard({ applications }: { applications: ApplicationSummary[] }) {
  return (
    <Kanban className="application-board">
      {applicationStatusSchema.options.map((status) => (
        <BoardColumn
          key={status}
          status={status}
          applications={applications}
          column={applications.filter((item) => item.status === status)}
        />
      ))}
    </Kanban>
  )
}

function BoardColumn({
  status,
  applications,
  column,
}: {
  status: ApplicationStatus
  applications: ApplicationSummary[]
  column: ApplicationSummary[]
}) {
  const busy = useAppStore((s) => s.busy)
  const navigate = useNavigate()
  const dragAndDropHooks = useKanbanColumn({
    column: status,
    dragType: DRAG_TYPE,
    textOf: (key) => applications.find((item) => item.id === key)?.role || 'Application',
    onMove: (key, to) => void setApplicationStatus(key, to as ApplicationStatus),
  })
  return (
    <Kanban.Column data-status={status} aria-labelledby={`column-${status}`}>
      <Kanban.ColumnHeader>
        <Kanban.ColumnIndicator>
          <Icon icon={STATUS_ICONS[status]} width={14} />
        </Kanban.ColumnIndicator>
        <Kanban.ColumnTitle id={`column-${status}`}>{STATUS_LABELS[status]}</Kanban.ColumnTitle>
        <Kanban.ColumnCount>{column.length}</Kanban.ColumnCount>
        {status === 'preparing' && (
          <Kanban.ColumnActions>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="New application"
              isDisabled={busy}
              onPress={() => {
                startOver()
                navigate('/')
              }}
            >
              <Icon icon="lucide:plus" width={15} />
            </Button>
          </Kanban.ColumnActions>
        )}
      </Kanban.ColumnHeader>
      <Kanban.ColumnBody>
        <Kanban.ScrollShadow>
          <Kanban.CardList
            aria-label={`${STATUS_LABELS[status]} applications`}
            items={column}
            dragAndDropHooks={busy ? undefined : dragAndDropHooks}
            // pressing a card opens its application, as Continue or Open does
            onAction={(key) =>
              void openApplication(String(key)).then((opened) => {
                if (opened) navigate('/')
              })
            }
            renderEmptyState={() => <div className="kanban__empty">{EMPTY[status]}</div>}
          >
            {(application) => (
              <Kanban.Card id={application.id} textValue={application.role || 'Untitled role'}>
                <ApplicationCard application={application} />
              </Kanban.Card>
            )}
          </Kanban.CardList>
        </Kanban.ScrollShadow>
      </Kanban.ColumnBody>
    </Kanban.Column>
  )
}
