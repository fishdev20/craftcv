import { useNavigate } from 'react-router'
import { Button, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import { replayOnboarding } from '@/features/onboarding/onboarding'
import { startOver } from '@/features/workspace/store'

/** Reopens the first-run setup without changing saved sources. */
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
            Walk through the first-run setup again. Nothing you have saved changes.
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
          Show setup again
        </Button>
      </div>
    </section>
  )
}
