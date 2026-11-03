import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Dropdown } from '@heroui/react'
import { applicationStatusSchema, type ApplicationSummary } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
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
  const name = application.role || 'Untitled role'
  const preparing = application.status === 'preparing'
  const choose = (key: string) => {
    if (key === 'link') void openApplicationLink(application.id)
    else if (key === 'remove') setRemoving(true)
    else void setApplicationStatus(application.id, applicationStatusSchema.parse(key))
  }
  if (removing)
    return (
      <div className="application-remove" role="group" aria-label={`Remove ${name}?`}>
        <span>Remove this application?</span>
        <Button
          size="sm"
          variant="danger"
          isDisabled={busy}
          onPress={() => void removeApplication(application.id)}
        >
          Remove
        </Button>
        <Button size="sm" variant="ghost" onPress={() => setRemoving(false)}>
          Keep
        </Button>
      </div>
    )
  return (
    <div className="application-actions">
      <Button
        size="sm"
        variant={preparing ? 'primary' : 'outline'}
        isDisabled={busy}
        onPress={() =>
          void openApplication(application.id).then((opened) => {
            if (opened) navigate('/')
          })
        }
      >
        {preparing ? 'Continue' : 'Open'}
      </Button>
      <Dropdown>
        {/* a Button as the trigger keeps its own centring; Dropdown.Trigger is inline-block */}
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={`Actions for ${name}`}
          isDisabled={busy}
        >
          <Icon icon="lucide:ellipsis" width={16} />
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
