import type { ComponentProps, HTMLAttributes, ReactNode } from 'react'
import { Disclosure } from '@heroui/react'
import { Icon } from './icons'
import TextShimmer from './TextShimmer'

/* A CraftCV analysis trace composed from HeroUI Disclosure and semantic list elements. */

const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')

function ChainOfThoughtRoot({
  isStreaming = false,
  className,
  ...props
}: ComponentProps<typeof Disclosure> & { isStreaming?: boolean }) {
  return (
    <Disclosure
      {...props}
      className={cx('chain-of-thought', typeof className === 'string' && className)}
      data-streaming={isStreaming || undefined}
    />
  )
}

/** The line that opens and closes the trace; shimmers while the trace is streaming. */
function Trigger({ children, isStreaming }: { children: ReactNode; isStreaming?: boolean }) {
  return (
    <Disclosure.Heading>
      <Disclosure.Trigger className="chain-of-thought__trigger">
        <Icon icon="lucide:sparkles" width={14} />
        {isStreaming ? <TextShimmer>{children}</TextShimmer> : <span>{children}</span>}
        <Disclosure.Indicator />
      </Disclosure.Trigger>
    </Disclosure.Heading>
  )
}

function Content({ children }: { children: ReactNode }) {
  return (
    <Disclosure.Content className="chain-of-thought__content">
      <Disclosure.Body>{children}</Disclosure.Body>
    </Disclosure.Content>
  )
}

function Steps({ className, ...props }: HTMLAttributes<HTMLOListElement>) {
  return <ol {...props} className={cx('chain-of-thought__steps', className)} />
}

export type StepStatus = 'pending' | 'active' | 'complete' | 'failed'

const MARKS: Record<StepStatus, string | null> = {
  pending: null,
  active: null,
  complete: 'lucide:check',
  failed: 'lucide:x',
}

/** One step: a marker on the timeline, its label, and what it found. */
function Step({
  label,
  status = 'complete',
  children,
  className,
}: {
  label?: ReactNode
  status?: StepStatus
  children?: ReactNode
  className?: string
}) {
  const mark = MARKS[status]
  return (
    <li className={cx('chain-of-thought__step', className)} data-status={status}>
      <span className="chain-of-thought__step-marker" aria-hidden="true">
        {mark && <Icon icon={mark} width={10} />}
      </span>
      {label && (
        <div className="chain-of-thought__step-label">
          {status === 'active' ? <TextShimmer>{label}</TextShimmer> : label}
        </div>
      )}
      {children && <div className="chain-of-thought__step-content">{children}</div>}
    </li>
  )
}

export const ChainOfThought = Object.assign(ChainOfThoughtRoot, {
  Trigger,
  Content,
  Steps,
  Step,
})
