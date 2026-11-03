import { useEffect, useState } from 'react'
import { Button, Chip, Typography } from '@heroui/react'
import type { JobAnalysisDraft, JobAnalysisEvent, Provider } from '@shared/contracts'
import { appApi } from '@/common/api/app-api'
import { bridge } from '@/common/api/bridge'
import { action } from '@/common/store/app-store'
import { ChainOfThought, type StepStatus } from '@/common/ui/ChainOfThought'
import { ChatLoader } from '@/common/ui/ChatLoader'
import { providerName } from '@/features/ai/providers'

const STAGES: JobAnalysisEvent['stage'][] = ['access', 'send', 'stream', 'check', 'done']

export type AnalysisRun = { provider: Provider; model: string; startedAt: number }

type Trace = {
  stage: JobAnalysisEvent['stage'] | null
  /** The last stage reached before a failure, so the failed step can be marked. */
  reached: JobAnalysisEvent['stage'] | null
  draft: JobAnalysisDraft
  dropped: string[]
  error: string | null
  finishedAt: number | null
}

const empty: Trace = {
  stage: null,
  reached: null,
  draft: {},
  dropped: [],
  error: null,
  finishedAt: null,
}

/** This application's analysis as it runs, from the events the main process sends. */
function useTrace(applicationId: string, run: AnalysisRun | null): Trace {
  const [trace, setTrace] = useState<Trace>(empty)
  const [runStarted, setRunStarted] = useState(run?.startedAt)
  // a new run starts from nothing
  if (run?.startedAt !== runStarted) {
    setRunStarted(run?.startedAt)
    setTrace(empty)
  }
  useEffect(
    () =>
      bridge().onJobAnalysis((event) => {
        if (event.applicationId !== applicationId) return
        setTrace((current) => ({
          stage: event.stage,
          reached: event.stage === 'failed' ? current.stage : event.stage,
          draft: event.draft ?? current.draft,
          dropped: event.dropped ?? current.dropped,
          error: event.error ?? null,
          finishedAt:
            event.stage === 'done' || event.stage === 'failed' ? Date.now() : current.finishedAt,
        }))
      }),
    [applicationId],
  )
  return trace
}

function statusOf(trace: Trace, stage: JobAnalysisEvent['stage']): StepStatus {
  const at = STAGES.indexOf(
    trace.stage === 'failed' ? (trace.reached ?? 'access') : (trace.stage ?? 'access'),
  )
  const index = STAGES.indexOf(stage)
  if (trace.stage === 'failed' && index === Math.max(at, 0)) return 'failed'
  if (trace.stage === 'done' || index < at) return 'complete'
  return index === at ? (trace.stage === 'failed' ? 'pending' : 'active') : 'pending'
}

function Terms({ title, terms }: { title: string; terms?: string[] }) {
  if (!terms?.length) return null
  return (
    <div className="trace-terms">
      <span>{title}</span>
      <div className="requirement-chips">
        {terms.map((term) => (
          <Chip key={term} size="sm" variant="soft" className="trace-chip">
            {term}
          </Chip>
        ))}
      </div>
    </div>
  )
}

/** What has streamed in so far: the details as they are written, then the terms one by one. */
function Draft({ draft }: { draft: JobAnalysisDraft }) {
  const details = (
    [
      ['Role', draft.role],
      ['Company', draft.company],
      ['Location', draft.location],
    ] as const
  ).filter(([, value]) => value)
  if (!details.length && !draft.mustHave?.length && !draft.responsibilities?.length)
    return <ChatLoader.Dots />
  return (
    <div className="trace-draft">
      {!!details.length && (
        <dl className="trace-details">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <Terms title="Must have" terms={draft.mustHave} />
      <Terms title="Nice to have" terms={draft.niceToHave} />
      <Terms title="Keywords" terms={draft.keywords} />
      {!!draft.responsibilities?.length && (
        <Typography.Paragraph size="sm" className="trace-note">
          {draft.responsibilities.length} responsibilit
          {draft.responsibilities.length === 1 ? 'y' : 'ies'} summarised
        </Typography.Paragraph>
      )}
    </div>
  )
}

const seconds = (from: number, to: number) => Math.max(1, Math.round((to - from) / 1000))

/**
 * The analysis as it happens: connecting, sending the job, the reply streaming in, and the
 * check that keeps only terms the posting names. Open while it runs; it folds away once done.
 */
export default function AnalysisTrace({
  applicationId,
  run,
}: {
  applicationId: string
  run: AnalysisRun
}) {
  const trace = useTrace(applicationId, run)
  const running = trace.stage !== 'done' && trace.stage !== 'failed'
  const [expanded, setExpanded] = useState(true)
  const [wasRunning, setWasRunning] = useState(running)
  // fold away once the run finishes well; a failure stays open to show where it stopped
  if (wasRunning !== running) {
    setWasRunning(running)
    if (!running) setExpanded(trace.stage === 'failed')
  }
  const kept =
    (trace.draft.mustHave?.length ?? 0) +
    (trace.draft.niceToHave?.length ?? 0) +
    (trace.draft.keywords?.length ?? 0)
  const title = running
    ? 'Analysing the job…'
    : trace.stage === 'failed'
      ? trace.error === 'Stopped.'
        ? 'Analysis stopped'
        : 'Analysis failed'
      : `Analysed in ${seconds(run.startedAt, trace.finishedAt ?? run.startedAt)}s`
  return (
    <div className="analysis-trace" aria-live="polite">
      <div className="analysis-trace-head">
        <ChainOfThought isStreaming={running} isExpanded={expanded} onExpandedChange={setExpanded}>
          <ChainOfThought.Trigger isStreaming={running}>{title}</ChainOfThought.Trigger>
          <ChainOfThought.Content>
            <ChainOfThought.Steps>
              <ChainOfThought.Step
                label={`Connect to ${providerName(run.provider)}`}
                status={statusOf(trace, 'access')}
              >
                {run.model}
              </ChainOfThought.Step>
              <ChainOfThought.Step
                label="Send the job description"
                status={statusOf(trace, 'send')}
              >
                Only the posting’s text and link are sent.
              </ChainOfThought.Step>
              <ChainOfThought.Step label="Read the job" status={statusOf(trace, 'stream')}>
                {statusOf(trace, 'stream') !== 'pending' && <Draft draft={trace.draft} />}
              </ChainOfThought.Step>
              <ChainOfThought.Step
                label="Check each term against the posting"
                status={statusOf(trace, 'check')}
              >
                {(trace.stage === 'check' || trace.stage === 'done') &&
                  (trace.dropped.length
                    ? `Kept ${kept} terms the posting names. Left out ${trace.dropped.length} it never mentions: ${trace.dropped.join(', ')}.`
                    : `Kept all ${kept} terms; each one appears in the posting.`)}
              </ChainOfThought.Step>
              <ChainOfThought.Step label="Save to the application" status={statusOf(trace, 'done')}>
                {trace.stage === 'failed' && trace.error}
              </ChainOfThought.Step>
            </ChainOfThought.Steps>
          </ChainOfThought.Content>
        </ChainOfThought>
        {running && (
          <Button size="sm" variant="ghost" onPress={() => void action(appApi.cancel)}>
            Stop
          </Button>
        )}
      </div>
    </div>
  )
}
