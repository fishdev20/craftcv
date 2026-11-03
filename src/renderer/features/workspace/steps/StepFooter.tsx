import type { ReactNode } from 'react'
import { Button } from '@heroui/react'
import { Icon } from '@/common/ui/icons'

/** A step's way back and forward; `next` may be replaced by its own control. */
export default function StepFooter({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  children,
}: {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  children?: ReactNode
}) {
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
          <Button isDisabled={nextDisabled} onPress={onNext}>
            {nextLabel}
            <Icon icon="lucide:arrow-right" width={15} />
          </Button>
        ))}
    </footer>
  )
}
