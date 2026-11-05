import { Chip, Spinner, Table } from '@heroui/react'
import { applicationStatusSchema, type ApplicationSummary } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import SelectField from '@/common/ui/SelectField'
import { useAppStore } from '@/common/store/app-store'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { STATUS_LABELS, setApplicationStatus } from '../actions'
import { STEP_LABELS, day } from '../meta'
import ApplicationActions from './ApplicationActions'

const STATUS_OPTIONS = applicationStatusSchema.options.map((status) => ({
  id: status,
  label: STATUS_LABELS[status],
}))

/** Every application as a row, its status chosen from a select in the row. */
export default function ApplicationTable({ applications }: { applications: ApplicationSummary[] }) {
  const busy = useAppStore((s) => s.busy)
  return (
    <Table className="application-table">
      <Table.ScrollContainer>
        {/* tab moves between the controls in a row, as in a form */}
        <Table.Content aria-label="Applications" keyboardNavigationBehavior="tab">
          <Table.Header>
            <Table.Column isRowHeader>Role</Table.Column>
            <Table.Column>Status</Table.Column>
            <Table.Column>Progress</Table.Column>
            <Table.Column>Updated</Table.Column>
            <Table.Column>
              <span className="sr-only">Actions</span>
            </Table.Column>
          </Table.Header>
          <Table.Body items={applications}>
            {(application) => {
              const name = application.role || 'Untitled role'
              return (
                <Table.Row id={application.id}>
                  <Table.Cell>
                    <span className="application-name">
                      <strong>{name}</strong>
                      <span>
                        {[application.company, application.location].filter(Boolean).join(' · ') ||
                          'Company not set'}
                      </span>
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusCell application={application} busy={busy} />
                  </Table.Cell>
                  <Table.Cell>
                    {application.status === 'preparing' ? (
                      <Chip size="sm" variant="soft">
                        <Icon icon="lucide:pencil-line" width={12} />
                        {STEP_LABELS[application.step]}
                      </Chip>
                    ) : application.appliedAt ? (
                      <span className="application-muted">
                        Applied {day(application.appliedAt)}
                      </span>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>
                    <span className="application-muted">{day(application.updatedAt)}</span>
                  </Table.Cell>
                  <Table.Cell>
                    <ApplicationActions application={application} withMoves={false} />
                  </Table.Cell>
                </Table.Row>
              )
            }}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  )
}

function StatusCell({ application, busy }: { application: ApplicationSummary; busy: boolean }) {
  const { pending, run } = usePendingAction()
  return (
    <div className="application-status-control" aria-busy={pending !== null}>
      <SelectField
        label={`Status of ${application.role || 'Untitled role'}`}
        hideLabel
        className="application-status-select"
        options={STATUS_OPTIONS}
        value={application.status}
        isDisabled={busy || pending !== null}
        onChange={(status) => {
          if (status !== application.status)
            void run('status', () =>
              setApplicationStatus(application.id, applicationStatusSchema.parse(status)),
            )
        }}
      />
      {pending && <Spinner aria-label="Updating status" size="sm" />}
    </div>
  )
}
