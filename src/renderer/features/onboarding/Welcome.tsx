import { Button, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import Logo from '@/common/ui/Logo'
import { finishWelcome } from './onboarding'

const POINTS = [
  {
    icon: 'lucide:file-text',
    title: 'Reads the job',
    text: 'Paste a job or its link, and have AI pick out what it asks for if you like.',
  },
  {
    icon: 'lucide:folder-git-2',
    title: 'Finds your evidence',
    text: 'It reads the projects you choose, on this device, for proof of each requirement.',
  },
  {
    icon: 'lucide:pencil-line',
    title: 'Tailors your CV',
    text: 'It drafts CV lines backed by your code. You approve each one before it goes into a copy of your CV.',
  },
]

/** The first screen of a new install: what CraftCV does, and why it is safe to point at your code. */
export default function Welcome() {
  return (
    <section className="welcome" aria-labelledby="welcome-heading">
      <Logo size={48} />
      <Typography.Heading level={1} id="welcome-heading">
        Welcome to CraftCV
      </Typography.Heading>
      <Typography.Paragraph size="sm" className="welcome-lead">
        Tailor your CV to each job, backed by evidence from your own code.
      </Typography.Paragraph>
      <ul className="welcome-points">
        {POINTS.map((point) => (
          <li key={point.title}>
            <span className="welcome-point-icon">
              <Icon icon={point.icon} width={18} />
            </span>
            <span>
              <strong>{point.title}</strong>
              {point.text}
            </span>
          </li>
        ))}
      </ul>
      <Typography.Paragraph size="sm" className="welcome-privacy">
        <Icon icon="lucide:shield-check" width={16} />
        Everything runs on this device. Your files are never changed, and nothing is sent to an AI
        provider unless you choose to.
      </Typography.Paragraph>
      <div className="welcome-actions">
        <Button onPress={() => finishWelcome({ hideSetup: false })}>
          Get started
          <Icon icon="lucide:arrow-right" width={15} />
        </Button>
        <Button variant="ghost" onPress={() => finishWelcome({ hideSetup: true })}>
          Skip
        </Button>
      </div>
    </section>
  )
}
