import { useEffect, useRef } from 'react'
import { Button } from '@heroui/react'
import { useAppStore } from '@/common/store/app-store'
import { Icon } from '@/common/ui/icons'
import Page from '@/common/ui/Page'
import ReviewPanel from './review/ReviewPanel'
import AnalysisStep from './steps/AnalysisStep'
import CvStep from './steps/CvStep'
import JobStep from './steps/JobStep'
import ProjectsStep from './steps/ProjectsStep'
import WizardSteps from './steps/WizardSteps'
import { startOver, useWorkspaceStore } from './store'

/** A new application, one step per page: job, requirements, CV, projects, then the review. */
export default function WorkspacePage() {
  const step = useWorkspaceStore((s) => s.step)
  const title = useWorkspaceStore((s) =>
    s.application
      ? [s.application.job.role, s.application.job.company].filter(Boolean).join(' at ') ||
        'Untitled application'
      : null,
  )
  const busy = useAppStore((s) => s.busy)
  const shown = useRef(step)
  // each step is its own page, so it opens at the top rather than where the last one was scrolled
  useEffect(() => {
    if (shown.current === step) return
    shown.current = step
    window.scrollTo({ top: 0 })
  }, [step])
  return (
    <Page
      title={title ?? 'New application'}
      description={
        title
          ? 'Saved as you go. Pick it up any time from Applications.'
          : 'Add a job, choose your CV and projects, then review source-backed bullet drafts.'
      }
      actions={
        title && (
          <Button size="sm" isDisabled={busy} onPress={startOver}>
            <Icon icon="lucide:plus" width={14} />
            New application
          </Button>
        )
      }
    >
      <WizardSteps />
      <div className="workflow" data-step={step}>
        {step === 'job' && <JobStep />}
        {step === 'analysis' && <AnalysisStep />}
        {step === 'cv' && <CvStep />}
        {step === 'projects' && <ProjectsStep />}
        {step === 'review' && <ReviewPanel />}
      </div>
    </Page>
  )
}
