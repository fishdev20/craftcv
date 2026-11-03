import type { ApplicationStep } from '@shared/contracts'
import { useAppStore } from '@/common/store/app-store'
import { Stepper } from '@/common/ui/Stepper'
import { goToStep } from '../actions'
import { STEPS, useWorkspaceStore } from '../store'

const LABELS: Record<ApplicationStep, string> = {
  job: 'Job',
  analysis: 'Check the job',
  cv: 'Your CV',
  projects: 'Projects',
  review: 'Review',
}

/** Where the application is, and the steps it can go back or forward to. */
export default function WizardSteps() {
  const step = useWorkspaceStore((s) => s.step)
  const started = useWorkspaceStore((s) => s.application !== null),
    hasCv = useWorkspaceStore((s) => s.resumeId !== null),
    reviewed = useWorkspaceStore((s) => s.session !== null)
  const reachable: Record<ApplicationStep, boolean> = {
    job: true,
    analysis: started,
    cv: started,
    projects: started && hasCv,
    review: reviewed,
  }
  const busy = useAppStore((s) => s.busy)
  return (
    <nav className="wizard-navigation" aria-label="Application steps">
      <Stepper
        className="wizard-steps"
        currentStep={STEPS.indexOf(step)}
        onStepChange={(index) => goToStep(STEPS[index])}
      >
        {STEPS.map((id) => (
          <Stepper.Step key={id} isDisabled={busy || !reachable[id]}>
            <Stepper.Indicator />
            <Stepper.Content>
              <Stepper.Title>{LABELS[id]}</Stepper.Title>
            </Stepper.Content>
            <Stepper.Separator />
          </Stepper.Step>
        ))}
      </Stepper>
    </nav>
  )
}
