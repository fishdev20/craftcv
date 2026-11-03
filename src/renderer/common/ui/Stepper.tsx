import {
  Children,
  createContext,
  isValidElement,
  useContext,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { Icon } from './icons'

/* CraftCV's compound stepper, built from semantic HTML and HeroUI v3 design tokens. */

export type StepStatus = 'inactive' | 'active' | 'complete'
type Size = 'sm' | 'md' | 'lg'

type StepperContext = {
  currentStep: number
  size: Size
  onStepChange?: (step: number) => void
}
type StepContext = { index: number; status: StepStatus; isLast: boolean; isDisabled: boolean }

const StepperState = createContext<StepperContext | null>(null)
const StepState = createContext<StepContext | null>(null)

function useStepper() {
  const context = useContext(StepperState)
  if (!context) throw new Error('Stepper parts must be inside a Stepper.')
  return context
}

/** Where a step stands: its 0-based index, status and whether it is the last. */
function useStepperStep() {
  const context = useContext(StepState)
  if (!context) throw new Error('Stepper step parts must be inside Stepper.Step.')
  return context
}

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')

type StepperProps = Omit<HTMLAttributes<HTMLOListElement>, 'onChange'> & {
  currentStep: number
  onStepChange?: (step: number) => void
  size?: Size
}

function StepperRoot({
  currentStep,
  onStepChange,
  size = 'md',
  className,
  children,
  ...props
}: StepperProps) {
  const steps = Children.toArray(children).filter(isValidElement)
  return (
    <StepperState.Provider value={{ currentStep, size, onStepChange }}>
      <ol
        {...props}
        className={cx('stepper', 'stepper--horizontal', `stepper--${size}`, className)}
      >
        {steps.map((step, index) => (
          <StepState.Provider
            key={step.key ?? index}
            value={{
              index,
              status:
                index < currentStep ? 'complete' : index === currentStep ? 'active' : 'inactive',
              isLast: index === steps.length - 1,
              isDisabled: Boolean((step.props as { isDisabled?: boolean }).isDisabled),
            }}
          >
            {step}
          </StepState.Provider>
        ))}
      </ol>
    </StepperState.Provider>
  )
}

/**
 * One step. Its parts other than the separator sit in a button when the stepper takes
 * `onStepChange`; `isDisabled` keeps a step from being pressed.
 */
function Step({
  children,
  className,
}: {
  children: ReactNode
  className?: string
  isDisabled?: boolean
}) {
  const { onStepChange } = useStepper()
  const { index, status, isDisabled } = useStepperStep()
  const parts = Children.toArray(children)
  const separator = parts.filter((part) => isValidElement(part) && part.type === Separator)
  const body = parts.filter((part) => !(isValidElement(part) && part.type === Separator))
  const clickable = Boolean(onStepChange) && !isDisabled && status !== 'active'
  return (
    <li
      className={cx('stepper__step', 'stepper__step--horizontal', className)}
      data-status={status}
    >
      <button
        type="button"
        className="stepper__step-button stepper__step-button--horizontal"
        data-clickable={clickable || undefined}
        disabled={!clickable}
        aria-current={status === 'active' ? 'step' : undefined}
        onClick={() => onStepChange?.(index)}
      >
        {body}
      </button>
      {separator}
    </li>
  )
}

/** The circle: the step's number, or a check once it is complete. */
function Indicator({ children, className }: { children?: ReactNode; className?: string }) {
  const { size } = useStepper()
  const { index, status } = useStepperStep()
  return (
    <span
      className={cx('stepper__indicator', `stepper__indicator--${size}`, className)}
      data-status={status}
      aria-hidden="true"
    >
      {children ??
        (status === 'complete' ? (
          <StepIcon>
            <Icon icon="lucide:check" />
          </StepIcon>
        ) : (
          index + 1
        ))}
    </span>
  )
}

function StepIcon({ children }: { children: ReactNode }) {
  return <span className="stepper__icon">{children}</span>
}

function Content({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cx('stepper__content', 'stepper__content--horizontal', className)}
    />
  )
}

function Title({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  const { size } = useStepper()
  return <span {...props} className={cx('stepper__title', `stepper__title--${size}`, className)} />
}

/** The line to the next step, filled as far as the stepper has got; hidden on the last step. */
function Separator({
  progress,
  force = false,
  className,
}: {
  progress?: number
  force?: boolean
  className?: string
}) {
  const { status, isLast } = useStepperStep()
  if (isLast && !force) return null
  const fill = Math.min(1, Math.max(0, progress ?? (status === 'complete' ? 1 : 0)))
  return (
    <div
      className={cx('stepper__separator', 'stepper__separator--horizontal', className)}
      aria-hidden="true"
    >
      <div
        className="stepper__separator-track stepper__separator-track--horizontal"
        data-complete={fill === 1 || undefined}
        style={{ '--stepper-separator-progress': fill } as CSSProperties}
      >
        <div className="stepper__separator-fill stepper__separator-fill--horizontal" />
      </div>
    </div>
  )
}

export const Stepper = Object.assign(StepperRoot, {
  Step,
  Indicator,
  Content,
  Title,
  Separator,
})
