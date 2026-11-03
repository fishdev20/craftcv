import { Button, Disclosure, Typography } from '@heroui/react'
import type { Project } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import ConnectProviderNote from '@/features/ai/ConnectProviderNote'
import ConsentCheckbox from '@/features/ai/ConsentCheckbox'
import ProviderModelFields from '@/features/ai/ProviderModelFields'
import { providerName } from '@/features/ai/providers'
import { useProviderChoice } from '@/features/ai/useProviderChoice'
import { understandProjects } from '@/features/projects/actions'

/** One bounded AI request per selected project, so analysis can use what each one is. */
export default function UnderstandSelectedProjects({ projects }: { projects: Project[] }) {
  const busy = useAppStore((s) => s.busy)
  const choice = useProviderChoice()
  const count = projects.length,
    understood = projects.filter((project) => project.analysis).length,
    noun = count === 1 ? 'project' : 'projects'
  return (
    <Disclosure className="selected-project-understanding">
      <Disclosure.Heading>
        <Disclosure.Trigger>
          <Icon icon="lucide:sparkles" width={15} />
          Understand selected projects with AI
          <small>{count ? `${understood}/${count} understood` : 'Select projects first'}</small>
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body className="selected-project-ai-controls">
          <Typography.Paragraph size="sm">
            Sends one bounded request per selected project with service names plus README and
            manifest excerpts. Full source code and absolute paths are not sent.
          </Typography.Paragraph>
          <ProviderModelFields choice={choice} isDisabled={busy} />
          <ConsentCheckbox
            isSelected={choice.consent}
            isDisabled={busy}
            onChange={choice.setConsent}
          >
            I consent to sharing the bounded context of {count || 'the'} selected {noun} with{' '}
            {providerName(choice.provider)}.
          </ConsentCheckbox>
          {!choice.connected && <ConnectProviderNote />}
          <Button
            isDisabled={busy || !count || !choice.connected || !choice.consent || !choice.model}
            onClick={() => void understandProjects(projects, choice)}
          >
            <Icon icon="lucide:sparkles" width={15} />
            Analyze {count || 'selected'} {noun} with AI
          </Button>
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  )
}
