import { Typography } from '@heroui/react'
import { useAppStore } from '@/common/store/app-store'
import PanelHeading from '../PanelHeading'
import { continueFromCv, goToStep } from '../actions'
import ResumePicker from '../context/ResumePicker'
import { useWorkspaceStore } from '../store'
import StepFooter from './StepFooter'

/** Step 3: the master CV this application starts from. */
export default function CvStep() {
  const resumeId = useWorkspaceStore((s) => s.resumeId)
  const ready = useAppStore(
    (s) => resumeId !== null && !!s.dashboard?.resumes.some((resume) => resume.id === resumeId),
  )
  const busy = useAppStore((s) => s.busy)
  return (
    <section className="step-panel" aria-labelledby="cv-heading">
      <PanelHeading step={3} id="cv-heading" title="Choose your master CV" />
      <div className="step-body">
        <Typography.Paragraph size="sm" className="step-intro">
          Choose the CV to start from. Approved project bullets can be added to a new document; this
          original stays unchanged.
        </Typography.Paragraph>
        <ResumePicker />
      </div>
      <StepFooter
        onBack={() => goToStep('analysis')}
        nextDisabled={!ready || busy}
        onNext={continueFromCv}
      />
    </section>
  )
}
