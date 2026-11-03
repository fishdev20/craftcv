import { Card, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'

const privacy = [
  {
    icon: 'lucide:lock-keyhole',
    title: 'Credentials are encrypted',
    body: 'API keys and ChatGPT OAuth tokens are encrypted with your operating system’s credential protection. CraftCV refuses to store credentials if secure encryption is unavailable.',
  },
  {
    icon: 'lucide:hard-drive',
    title: 'Documents stay on this device',
    body: 'CV text, job descriptions, evidence snippets, and review history live in the local CraftCV application-data directory. CraftCV does not encrypt them; use your operating system’s disk encryption for protection at rest.',
  },
  {
    icon: 'lucide:link-2',
    title: 'Job links are opened only when you import one',
    body: 'Importing a job link sends one request from this device to that site, without cookies, so the site can see the job was opened. If you open a posting in CraftCV instead, anything you sign in to there is forgotten when CraftCV closes. Links to this computer or your local network are refused.',
  },
  {
    icon: 'lucide:cloud-off',
    title: 'Nothing runs in the background',
    body: 'Cloud requests require consent for each session. There is no telemetry, automatic scanning, or background AI activity. Remove CVs from Your sources, and applications and earlier analyses from Applications; removing a repository also removes its scan cache.',
  },
]

/** What CraftCV keeps, where, and what it never does. */
export default function PrivacySection() {
  return (
    <section className="settings-group" aria-labelledby="privacy-heading">
      <div className="settings-group-heading">
        <div>
          <Typography.Heading level={2} id="privacy-heading">
            Privacy & storage
          </Typography.Heading>
          <Typography.Paragraph size="sm">
            What CraftCV keeps, where it keeps it, and what it never does.
          </Typography.Paragraph>
        </div>
      </div>
      <Card variant="transparent" className="privacy-list">
        {privacy.map((item) => (
          <div key={item.title} className="privacy-row">
            <span className="privacy-icon">
              <Icon icon={item.icon} width={18} />
            </span>
            <div>
              <Typography.Heading level={3}>{item.title}</Typography.Heading>
              <Typography.Paragraph size="sm">{item.body}</Typography.Paragraph>
            </div>
          </div>
        ))}
      </Card>
    </section>
  )
}
