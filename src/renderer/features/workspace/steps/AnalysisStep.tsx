import { useState } from 'react'
import { Button, Chip, Input, Label, TextField, Typography } from '@heroui/react'
import type { JobAnalysis } from '@shared/contracts'
import { useAppStore } from '@/common/store/app-store'
import { Icon } from '@/common/ui/icons'
import ConnectProviderNote from '@/features/ai/ConnectProviderNote'
import ConsentCheckbox from '@/features/ai/ConsentCheckbox'
import ProviderModelFields from '@/features/ai/ProviderModelFields'
import { providerName } from '@/features/ai/providers'
import { useProviderChoice } from '@/features/ai/useProviderChoice'
import { applicationsApi } from '@/features/applications/api'
import { continueFromAnalysis, enrichJob, goToStep } from '../actions'
import { useWorkspaceStore } from '../store'
import AnalysisTrace, { type AnalysisRun } from './AnalysisTrace'
import StepFooter from './StepFooter'

function Terms({ title, terms, accent }: { title: string; terms: string[]; accent?: boolean }) {
  if (!terms.length) return null
  return (
    <div className="requirement-group">
      <Typography.Heading level={4}>
        {title} <span>{terms.length}</span>
      </Typography.Heading>
      <div className="requirement-chips">
        {terms.map((term) => (
          <Chip
            key={term}
            size="sm"
            color={accent ? 'accent' : 'default'}
            variant={accent ? 'soft' : 'tertiary'}
          >
            {term}
          </Chip>
        ))}
      </div>
    </div>
  )
}

/** The provider, model and consent for analysing the job; nothing is sent until it runs. */
function AnalyzePanel({
  onStart,
  onClose,
}: {
  onStart: (run: AnalysisRun) => void
  onClose: () => void
}) {
  const busy = useAppStore((s) => s.busy)
  const choice = useProviderChoice()
  return (
    <div className="analyze-job-panel" role="group" aria-label="Analyse the job with AI">
      <Typography.Paragraph size="sm">
        Sends the job description, and its link if it has one, to the provider. It returns the
        requirements, keywords and responsibilities, keeping only terms the job’s text names.
      </Typography.Paragraph>
      <ProviderModelFields choice={choice} />
      <ConsentCheckbox isSelected={choice.consent} onChange={choice.setConsent}>
        I consent to sharing this job description with {providerName(choice.provider)}.
      </ConsentCheckbox>
      {!choice.connected && <ConnectProviderNote />}
      <div className="analyze-job-actions">
        <Button
          isDisabled={busy || !choice.connected || !choice.consent || !choice.model}
          onPress={() => {
            // the panel gives way to the trace, which follows the analysis as it runs
            onStart({ provider: choice.provider, model: choice.model, startedAt: Date.now() })
            onClose()
            void enrichJob({ provider: choice.provider, model: choice.model, tokenBudget: null })
          }}
        >
          <Icon icon="lucide:sparkles" width={15} />
          Analyse
        </Button>
        <Button variant="ghost" isDisabled={busy} onPress={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

/** What the AI read from the job: shown only once the person has asked for it. */
function Requirements({ analysis }: { analysis: JobAnalysis }) {
  return (
    <section className="job-requirements" aria-labelledby="requirements-heading">
      <div className="requirements-heading">
        <Typography.Heading level={3} id="requirements-heading">
          Requirements
        </Typography.Heading>
        {analysis.provider && (
          <Chip size="sm" variant="soft">
            <Icon icon="lucide:sparkles" width={12} />
            Analysed with {providerName(analysis.provider)}
          </Chip>
        )}
      </div>
      <Terms title="Must have" terms={analysis.mustHave} accent />
      <Terms title="Nice to have" terms={analysis.niceToHave} />
      <Terms title="Keywords" terms={analysis.keywords} />
      {!!analysis.responsibilities.length && (
        <div className="requirement-group">
          <Typography.Heading level={4}>Responsibilities</Typography.Heading>
          <ul className="responsibility-list">
            {analysis.responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/** Step 2: the job as written, with its details to confirm and an optional AI analysis. */
export default function AnalysisStep() {
  const application = useWorkspaceStore((s) => s.application)
  const busy = useAppStore((s) => s.busy)
  const [analyzing, setAnalyzing] = useState(false)
  const [run, setRun] = useState<AnalysisRun | null>(null)
  const [details, setDetails] = useState(() => ({
    role: application?.job.role ?? '',
    company: application?.job.company ?? '',
    location: application?.job.location ?? '',
  }))
  // details the AI fills in appear unless the person has typed their own
  const [seen, setSeen] = useState(application?.updatedAt)
  if (application && application.updatedAt !== seen) {
    setSeen(application.updatedAt)
    setDetails((current) => ({
      role: current.role || application.job.role,
      company: current.company || application.job.company,
      location: current.location || application.job.location,
    }))
  }
  if (!application) return null
  // only an analysis the person asked for; older applications may hold one read on the device
  const analysis = application.analysis?.source === 'ai' ? application.analysis : null
  const hasAiPane = !!(analysis || analyzing || run)
  const field = (key: keyof typeof details, label: string, placeholder: string) => (
    <TextField
      value={details[key]}
      onChange={(value) => setDetails((current) => ({ ...current, [key]: value }))}
      maxLength={200}
      isDisabled={busy}
    >
      <Label>{label}</Label>
      <Input placeholder={placeholder} />
    </TextField>
  )
  return (
    <section className="step-panel" aria-label="Check the job">
      <div className="step-body">
        <div className="job-details-grid">
          {field('role', 'Role', 'e.g. Senior Frontend Engineer')}
          {field('company', 'Company', 'e.g. Wolt')}
          {field('location', 'Location', 'e.g. Helsinki · Hybrid')}
        </div>
        <div className="job-analysis-comparison" data-has-ai-pane={hasAiPane || undefined}>
          <section className="job-description" aria-labelledby="job-description-heading">
            <div className="job-description-heading">
              <Typography.Heading level={3} id="job-description-heading">
                Original job description
              </Typography.Heading>
              <div className="job-description-actions">
                {application.job.url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() =>
                      void applicationsApi.openLink(application.id).catch(() => undefined)
                    }
                  >
                    View posting
                    <Icon icon="lucide:arrow-up-right" width={14} />
                  </Button>
                )}
                {!hasAiPane && (
                  <Button
                    size="sm"
                    variant="secondary"
                    isDisabled={busy}
                    onPress={() => setAnalyzing(true)}
                  >
                    <Icon icon="lucide:sparkles" width={14} />
                    Analyse the job
                  </Button>
                )}
              </div>
            </div>
            <div className="job-description-text">{application.job.description}</div>
          </section>
          {hasAiPane && (
            <section className="job-analysis-pane" aria-labelledby="job-analysis-heading">
              <div className="job-analysis-heading">
                <Typography.Heading level={3} id="job-analysis-heading">
                  AI analysis
                </Typography.Heading>
                <Button
                  size="sm"
                  variant={analysis ? 'outline' : 'secondary'}
                  isDisabled={busy || analyzing}
                  onPress={() => setAnalyzing(true)}
                >
                  <Icon icon="lucide:sparkles" width={14} />
                  {analysis ? 'Analyse again' : 'Analyse the job'}
                </Button>
              </div>
              {analyzing && <AnalyzePanel onStart={setRun} onClose={() => setAnalyzing(false)} />}
              {run && <AnalysisTrace applicationId={application.id} run={run} />}
              {analysis && <Requirements analysis={analysis} />}
            </section>
          )}
        </div>
      </div>
      <StepFooter
        onBack={() => goToStep('job')}
        nextDisabled={busy}
        onNext={() => continueFromAnalysis(details)}
      />
    </section>
  )
}
