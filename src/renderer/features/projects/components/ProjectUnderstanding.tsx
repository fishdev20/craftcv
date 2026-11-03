import { Button, Disclosure, Typography } from '@heroui/react'
import type { Project } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import ConnectProviderNote from '@/features/ai/ConnectProviderNote'
import ConsentCheckbox from '@/features/ai/ConsentCheckbox'
import ProviderModelFields from '@/features/ai/ProviderModelFields'
import { providerName } from '@/features/ai/providers'
import { useProviderChoice } from '@/features/ai/useProviderChoice'
import { understandProject } from '../actions'
import ProjectAnalysis from './ProjectAnalysis'

/** One project's AI understanding, and the request that creates or refreshes it. */
export default function ProjectUnderstanding({ project }: { project: Project }) {
  const busy = useAppStore((state) => state.busy)
  const choice = useProviderChoice()
  return (
    <Disclosure className="project-understanding">
      <Disclosure.Heading>
        <Disclosure.Trigger>
          <Icon icon="lucide:sparkles" width={15} />
          {project.analysis ? 'Architecture and service map' : 'Understand project with AI'}
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body>
          {project.analysis && <ProjectAnalysis analysis={project.analysis} />}
          <div className="project-ai-controls">
            <Typography.Paragraph size="sm">
              Shares bounded README and manifest excerpts, service names, and file paths. Source
              code is not sent in full.
            </Typography.Paragraph>
            <ProviderModelFields choice={choice} />
            <ConsentCheckbox isSelected={choice.consent} onChange={choice.setConsent}>
              I consent to sharing the bounded project context with {providerName(choice.provider)}.
            </ConsentCheckbox>
            {!choice.connected && <ConnectProviderNote />}
            <Button
              isDisabled={busy || !choice.connected || !choice.consent || !choice.model}
              onClick={() => void understandProject(project, choice)}
            >
              <Icon icon="lucide:sparkles" width={15} />
              {project.analysis ? 'Refresh understanding' : 'Analyze project'}
            </Button>
          </div>
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  )
}
