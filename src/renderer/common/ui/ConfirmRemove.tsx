import { useState } from 'react'
import { Button } from '@heroui/react'
import { Icon } from './icons'

/** A trash button that asks once before it removes anything. */
export default function ConfirmRemove({
  label,
  confirmLabel = 'Confirm removal',
  keepLabel = 'Keep',
  isDisabled,
  onConfirm,
}: {
  /** The accessible name of the trash button, e.g. "Remove project". */
  label: string
  confirmLabel?: string
  keepLabel?: string
  isDisabled?: boolean
  /** Resolves once the removal is finished; the confirmation closes after it. */
  onConfirm: () => Promise<unknown>
}) {
  const [confirming, setConfirming] = useState(false)
  if (!confirming)
    return (
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label={label}
        isDisabled={isDisabled}
        onClick={() => setConfirming(true)}
      >
        <Icon icon="lucide:trash-2" width={16} />
      </Button>
    )
  return (
    <span className="button-row">
      <Button
        size="sm"
        variant="danger"
        isDisabled={isDisabled}
        onClick={() => void onConfirm().finally(() => setConfirming(false))}
      >
        {confirmLabel}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        {keepLabel}
      </Button>
    </span>
  )
}
