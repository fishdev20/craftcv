import { Chip, Typography } from '@heroui/react'
import Page from '@/common/ui/Page'
import { useAppStore } from '@/common/store/app-store'
import ChatGPTCard from './components/ChatGPTCard'
import KeyCard from './components/KeyCard'
import OnboardingSection from './components/OnboardingSection'
import PrivacySection from './components/PrivacySection'

export default function SettingsPage() {
  const dashboard = useAppStore((s) => s.dashboard)
  const connected = [
    dashboard?.chatgpt.connected,
    dashboard?.keys.openai,
    dashboard?.keys.anthropic,
  ].filter(Boolean).length
  return (
    <Page
      title="AI providers"
      description="Connect a provider for project understanding and optional draft refinement."
    >
      <section className="settings-group" aria-labelledby="providers-heading">
        <div className="settings-group-heading">
          <div>
            <Typography.Heading level={2} id="providers-heading">
              AI providers
            </Typography.Heading>
            <Typography.Paragraph size="sm">
              Connect any one to refine drafts and understand projects. You choose per request.
            </Typography.Paragraph>
          </div>
          <Chip size="sm" variant="tertiary">
            {connected} of 3 connected
          </Chip>
        </div>
        <div className="provider-grid">
          <ChatGPTCard />
          <KeyCard provider="openai" />
          <KeyCard provider="anthropic" />
        </div>
      </section>
      <OnboardingSection />
      <PrivacySection />
    </Page>
  )
}
