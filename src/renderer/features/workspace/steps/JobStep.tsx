import { useState } from 'react'
import { Button, Tabs, Typography } from '@heroui/react'
import { JOB_MIN_LENGTH } from '@shared/job'
import { useAppStore } from '@/common/store/app-store'
import { Icon } from '@/common/ui/icons'
import { SAMPLE_JOB } from '@/features/onboarding/sample-job'
import PanelHeading from '../PanelHeading'
import { continueFromJob } from '../actions'
import JobDescriptionField from '../context/JobDescriptionField'
import JobLinkField from '../context/JobLinkField'
import { setJob, setLinked, useWorkspaceStore } from '../store'
import StepFooter from './StepFooter'

const host = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Step 1: the job, pasted or read from its posting's link. */
export default function JobStep() {
  const linkedUrl = useWorkspaceStore((s) => s.linked?.url ?? s.application?.job.url ?? null)
  const ready = useWorkspaceStore((s) => s.job.trim().length >= JOB_MIN_LENGTH)
  const busy = useAppStore((s) => s.busy)
  // until the first application, a made-up job lets the person try the flow
  const firstTime = useAppStore((s) => s.dashboard?.applications.length === 0)
  const empty = useWorkspaceStore((s) => !s.job.trim() && !s.application)
  const [tab, setTab] = useState<string>(linkedUrl ? 'paste' : 'link')
  return (
    <section className="step-panel" aria-labelledby="job-heading">
      <PanelHeading step={1} id="job-heading" title="Add the job" />
      <div className="step-body">
        <Typography.Paragraph size="sm" className="step-intro">
          Paste the job description, or import it from the posting’s link. Next you check the role
          and company, and can have AI analyse the requirements.
        </Typography.Paragraph>
        {firstTime && empty && (
          <Typography.Paragraph size="sm" className="sample-job">
            No job at hand?
            <Button
              size="sm"
              variant="ghost"
              isDisabled={busy}
              onPress={() => {
                setLinked(null)
                setJob(SAMPLE_JOB)
                setTab('paste')
              }}
            >
              Try a sample job
            </Button>
          </Typography.Paragraph>
        )}
        <Tabs selectedKey={tab} onSelectionChange={(key) => setTab(String(key))}>
          <Tabs.ListContainer>
            <Tabs.List aria-label="How to add the job">
              <Tabs.Tab id="link">
                <span className="job-tab-label">
                  <Icon icon="lucide:link-2" width={14} />
                  From a link
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="paste">
                <span className="job-tab-label">
                  <Icon icon="lucide:file-text" width={14} />
                  Paste the text
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="link" className="job-tab">
            <JobLinkField onImported={() => setTab('paste')} />
          </Tabs.Panel>
          <Tabs.Panel id="paste" className="job-tab">
            {linkedUrl && (
              <div className="job-source">
                <Icon icon="lucide:link-2" width={12} />
                Imported from {host(linkedUrl)}
              </div>
            )}
            <JobDescriptionField />
          </Tabs.Panel>
        </Tabs>
      </div>
      <StepFooter
        nextLabel="Analyse the job"
        nextDisabled={!ready || busy}
        onNext={continueFromJob}
      />
    </section>
  )
}
