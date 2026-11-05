import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Dropdown } from '@heroui/react'
import { applicationStatusSchema, type ApplicationSummary } from '@shared/contracts'
import { usePendingAction } from '@/common/ui/usePendingAction'
import ActionIcon from '@/common/ui/ActionIcon'
import { useAppStore } from '@/common/store/app-store'
import { openApplication } from '@/features/workspace/actions'
import {
  STATUS_LABELS,
  openApplicationLink,
  removeApplication,
  setApplicationStatus,
} from '../actions'

/**
 * Continue or open an application, and its menu: the job posting, removing it after a
 * confirmation and, where its status has no control of its own, moving it.
 */
export default function ApplicationActions({
  application,
  withMoves,
}: {
  application: ApplicationSummary
  withMoves: boolean
}) {
  const busy = useAppStore((s) => s.busy)
  const navigate = useNavigate()
  const [removing, setRemoving] = useState(false)
  const { pending, run } = usePendingAction()
  const name = application.role || 'Untitled role'
  const preparing = application.status === 'preparing'
  const choose = (key: string) => {
    if (key === 'link') void run('link', () => openApplicationLink(application.id))
    else if (key === 'remove') setRemoving(true)
    else
      void run('status', () =>
        setApplicationStatus(application.id, applicationStatusSchema.parse(key)),
      )
  }
  if (removing)
    return (
      <div className="application-remove" role="group" aria-label={`Remove ${name}?`}>
        <span>Remove this application?</span>
        <Button
          size="sm"
          variant="danger"
          isPending={pending === 'remove'}
          isDisabled={busy || pending !== null}
          onPress={() => void run('remove', () => removeApplication(application.id))}
        >
          {pending === 'remove' ? 'Removing…' : 'Remove'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          isDisabled={pending !== null}
          onPress={() => setRemoving(false)}
        >
          Keep
        </Button>
      </div>
    )
  return (
    <div className="application-actions">
      <Button
        size="sm"
        variant={preparing ? 'primary' : 'outline'}
        isPending={pending === 'open'}
        isDisabled={busy || pending !== null}
        onPress={() =>
          void run('open', () => openApplication(application.id)).then((opened) => {
            if (opened) navigate('/')
          })
        }
      >
        {pending === 'open' ? 'Opening…' : preparing ? 'Continue' : 'Open'}
      </Button>
      <Dropdown>
        {/* a Button as the trigger keeps its own centring; Dropdown.Trigger is inline-block */}
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={`Actions for ${name}`}
          isPending={pending === 'status' || pending === 'link'}
          isDisabled={busy || pending !== null}
        >
          <ActionIcon
            pending={pending === 'status' || pending === 'link'}
            icon="lucide:ellipsis"
            width={16}
          />
        </Button>
        <Dropdown.Popover placement="bottom end">
          <Dropdown.Menu
            aria-label={`Actions for ${name}`}
            disabledKeys={[application.status]}
            onAction={(key) => choose(String(key))}
          >
            {[
              ...(withMoves
                ? applicationStatusSchema.options.map((status) => (
                    <Dropdown.Item
                      key={status}
                      id={status}
                      textValue={`Move to ${STATUS_LABELS[status]}`}
                    >
                      Move to {STATUS_LABELS[status]}
                    </Dropdown.Item>
                  ))
                : []),
              ...(application.hasLink
                ? [
                    <Dropdown.Item key="link" id="link" textValue="Open the job posting">
                      Open the job posting
                    </Dropdown.Item>,
                  ]
                : []),
              <Dropdown.Item key="remove" id="remove" variant="danger" textValue="Remove">
                Remove…
              </Dropdown.Item>,
            ]}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  )
}
