import { useState } from 'react'
import { Button, Spinner } from '@heroui/react'
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
  const [removing, setRemoving] = useState(false)
  const remove = async () => {
    if (removing) return
    setRemoving(true)
    try {
      await onConfirm()
      setConfirming(false)
    } finally {
      setRemoving(false)
    }
  }
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
        isPending={removing}
        isDisabled={isDisabled || removing}
        onClick={() => void remove()}
      >
        {removing && <Spinner aria-hidden="true" size="sm" color="current" />}
        {removing ? 'Removing…' : confirmLabel}
      </Button>
      <Button size="sm" variant="ghost" isDisabled={removing} onClick={() => setConfirming(false)}>
        {keepLabel}
      </Button>
    </span>
  )
}
