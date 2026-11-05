import type { ReactNode } from 'react'
import { Button } from '@heroui/react'
import ActionIcon from '@/common/ui/ActionIcon'
import { Icon } from '@/common/ui/icons'
import { usePendingAction } from '@/common/ui/usePendingAction'

/** A step's way back and forward; `next` may be replaced by its own control. */
export default function StepFooter({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  children,
}: {
  onBack?: () => void
  onNext?: () => Promise<unknown> | void
  nextLabel?: string
  nextDisabled?: boolean
  children?: ReactNode
}) {
  const { pending, run } = usePendingAction()
  return (
    <footer className="step-footer">
      {onBack ? (
        <Button variant="ghost" onPress={onBack}>
          <Icon icon="lucide:arrow-left" width={15} />
          Back
        </Button>
      ) : (
        <span />
      )}
      {children ??
        (onNext && (
          <Button
            isDisabled={nextDisabled || pending !== null}
            isPending={pending === 'next'}
            onPress={() => void run('next', async () => onNext())}
          >
            {pending === 'next' ? 'Saving…' : nextLabel}
            <ActionIcon pending={pending === 'next'} icon="lucide:arrow-right" />
          </Button>
        ))}
    </footer>
  )
}
