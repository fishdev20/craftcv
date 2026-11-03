import { useNavigate } from 'react-router'
import { Button, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import { replayOnboarding } from '@/features/onboarding/onboarding'
import { startOver } from '@/features/workspace/store'

/** Brings back the first-run welcome and setup checklist, for a second look. */
export default function OnboardingSection() {
  const navigate = useNavigate()
  return (
    <section className="settings-group" aria-labelledby="onboarding-heading">
      <div className="settings-group-heading">
        <div>
          <Typography.Heading level={2} id="onboarding-heading">
            Getting started
          </Typography.Heading>
          <Typography.Paragraph size="sm">
            See the welcome and the setup checklist again. Nothing you have saved changes.
          </Typography.Paragraph>
        </div>
        <Button
          size="sm"
          variant="outline"
          onPress={() => {
            replayOnboarding()
            startOver()
            navigate('/')
          }}
        >
          <Icon icon="lucide:refresh-cw" width={14} />
          Show welcome and setup again
        </Button>
      </div>
    </section>
  )
}
