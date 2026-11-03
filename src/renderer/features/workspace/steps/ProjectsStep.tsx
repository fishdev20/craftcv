import { Typography } from '@heroui/react'
import PanelHeading from '../PanelHeading'
import { goToStep } from '../actions'
import AnalyzeFooter from '../context/AnalyzeFooter'
import ProjectPicker from '../context/ProjectPicker'
import StepFooter from './StepFooter'

/** Step 4: the projects whose code backs the CV, read on this device. */
export default function ProjectsStep() {
  return (
    <section className="step-panel" aria-labelledby="projects-heading">
      <PanelHeading step={4} id="projects-heading" title="Choose your projects" />
      <div className="step-body">
        <Typography.Paragraph size="sm" className="step-intro">
          CraftCV reads these projects on this device to find evidence for each requirement. Files
          are never modified, and only short matching excerpts are ever shared with AI, and only
          when you agree.
        </Typography.Paragraph>
        <ProjectPicker />
      </div>
      <StepFooter onBack={() => goToStep('cv')}>
        <AnalyzeFooter />
      </StepFooter>
    </section>
  )
}
