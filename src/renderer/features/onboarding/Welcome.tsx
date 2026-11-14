import { useEffect, useState } from 'react'
import { Button, Typography } from '@heroui/react'
import { useAppStore } from '@/common/store/app-store'
import ActionIcon from '@/common/ui/ActionIcon'
import { Icon } from '@/common/ui/icons'
import Logo from '@/common/ui/Logo'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { importRepositories } from '@/features/projects/actions'
import { importCv, startBlankCv } from '@/features/workspace/actions'
import OnboardingFigure from './OnboardingFigure'
import { beginWelcome, finishWelcome } from './onboarding'

type Stage = 'intro' | 'cv' | 'project' | 'ready'
const order: Stage[] = ['intro', 'cv', 'project', 'ready']

/** First-run setup is its own full-window experience, before the app shell mounts. */
export default function Welcome() {
  const [stage, setStage] = useState<Stage>('intro')
  const dashboard = useAppStore((s) => s.dashboard)
  const busy = useAppStore((s) => s.busy)
  const { pending, run } = usePendingAction()
  const cvCount = dashboard?.resumes.length ?? 0
  const projectCount = dashboard?.projects.length ?? 0
  const canMove = !busy && pending === null
  const next = () => {
    if (stage === 'intro') beginWelcome()
    setStage(order[Math.min(order.indexOf(stage) + 1, order.length - 1)])
  }
  const back = () => setStage(order[Math.max(order.indexOf(stage) - 1, 0)])

  useEffect(() => {
    document.getElementById('onboarding-heading')?.focus()
  }, [stage])

  return (
    <main className="onboarding" aria-labelledby="onboarding-heading">
      <header className="onboarding-topline">
        <span className="onboarding-brand">
          <Logo size={28} />
          CraftCV
        </span>
        <span className="onboarding-step-count">
          {stage === 'intro' ? 'A better starting point' : `${order.indexOf(stage)} / 3`}
        </span>
      </header>

      <div className="onboarding-layout">
        <div className="onboarding-story">
          <div className="onboarding-eyebrow">
            <span className="onboarding-pulse" />
            Your next application starts here
          </div>
          <OnboardingFigure focus={stage} />
          <div className="onboarding-story-footer">
            <span>CV</span>
            <span className="onboarding-story-line" />
            <span>WORK</span>
            <span className="onboarding-story-line" />
            <span>JOB</span>
          </div>
        </div>

        <section className="onboarding-content" key={stage}>
          <div className="onboarding-progress" aria-hidden="true">
            {order.slice(1).map((item, index) => (
              <span
                key={item}
                className={order.indexOf(stage) >= index + 1 ? 'is-current' : undefined}
              />
            ))}
          </div>

          {stage === 'intro' && (
            <>
              <p className="onboarding-kicker">WELCOME TO CRAFTCV</p>
              <Typography.Heading level={1} id="onboarding-heading" tabIndex={-1}>
                Your work deserves to be seen.
              </Typography.Heading>
              <Typography.Paragraph size="sm" className="onboarding-lead">
                Bring your CV and a project folder. CraftCV helps connect what a job asks for to
                work you can actually show.
              </Typography.Paragraph>
              <ul className="onboarding-benefits">
                <li>
                  <Icon icon="lucide:file-text" width={18} /> Keep your CV editable
                </li>
                <li>
                  <Icon icon="lucide:folder-git-2" width={18} /> Read projects as evidence
                </li>
                <li>
                  <Icon icon="lucide:sparkles" width={18} /> Review every suggested line
                </li>
              </ul>
              <Typography.Paragraph
                size="sm"
                className="onboarding-privacy onboarding-privacy--intro"
              >
                <Icon icon="lucide:shield-check" width={17} />
                Your files stay on this device. AI access is optional.
              </Typography.Paragraph>
              <div className="onboarding-actions">
                <Button onPress={next}>
                  Get started <Icon icon="lucide:arrow-right" width={16} />
                </Button>
                <Button variant="ghost" onPress={finishWelcome}>
                  Skip for now
                </Button>
              </div>
            </>
          )}

          {stage === 'cv' && (
            <>
              <p className="onboarding-kicker">01 / YOUR DOCUMENT</p>
              <Typography.Heading level={1} id="onboarding-heading" tabIndex={-1}>
                Start with your CV.
              </Typography.Heading>
              <Typography.Paragraph size="sm" className="onboarding-lead">
                Import a PDF or Word file, or begin with a blank document. Your original file stays
                where it is.
              </Typography.Paragraph>
              <div className="onboarding-source-list">
                {dashboard?.resumes.map((resume) => (
                  <div className="onboarding-source" key={resume.id}>
                    <Icon icon="lucide:circle-check" width={17} />
                    <span>{resume.name}</span>
                  </div>
                ))}
              </div>
              <div className="onboarding-choices">
                <Button
                  variant="secondary"
                  isPending={pending === 'cv'}
                  isDisabled={!canMove}
                  onPress={() => void run('cv', importCv)}
                >
                  <ActionIcon pending={pending === 'cv'} icon="lucide:upload" width={16} />
                  {pending === 'cv' ? 'Importing…' : 'Import CV'}
                </Button>
                <Button
                  variant="ghost"
                  isPending={pending === 'blank'}
                  isDisabled={!canMove}
                  onPress={() => void run('blank', startBlankCv)}
                >
                  <ActionIcon pending={pending === 'blank'} icon="lucide:file-text" width={16} />
                  {pending === 'blank' ? 'Creating…' : 'Start blank'}
                </Button>
              </div>
              <div className="onboarding-actions">
                <Button isDisabled={!canMove} onPress={next}>
                  {cvCount ? 'Continue' : 'Do this later'}{' '}
                  <Icon icon="lucide:arrow-right" width={16} />
                </Button>
                <Button variant="ghost" isDisabled={!canMove} onPress={back}>
                  Back
                </Button>
              </div>
            </>
          )}

          {stage === 'project' && (
            <>
              <p className="onboarding-kicker">02 / YOUR WORK</p>
              <Typography.Heading level={1} id="onboarding-heading" tabIndex={-1}>
                Show the work behind it.
              </Typography.Heading>
              <Typography.Paragraph size="sm" className="onboarding-lead">
                Choose a project folder. If it contains several repositories, CraftCV keeps them
                together as one project. You choose what to use for each job.
              </Typography.Paragraph>
              <div className="onboarding-source-list">
                {dashboard?.projects.map((project) => (
                  <div className="onboarding-source" key={project.id}>
                    <Icon icon="lucide:circle-check" width={17} />
                    <span>{project.name}</span>
                  </div>
                ))}
              </div>
              <div className="onboarding-choices">
                <Button
                  variant="secondary"
                  isPending={pending === 'project'}
                  isDisabled={!canMove}
                  onPress={() => void run('project', () => importRepositories('folder'))}
                >
                  <ActionIcon
                    pending={pending === 'project'}
                    icon="lucide:folder-plus"
                    width={16}
                  />
                  {pending === 'project' ? 'Adding folder…' : 'Add project folder'}
                </Button>
              </div>
              <div className="onboarding-actions">
                <Button isDisabled={!canMove} onPress={next}>
                  {projectCount ? 'Continue' : 'Do this later'}{' '}
                  <Icon icon="lucide:arrow-right" width={16} />
                </Button>
                <Button variant="ghost" isDisabled={!canMove} onPress={back}>
                  Back
                </Button>
              </div>
            </>
          )}

          {stage === 'ready' && (
            <>
              <p className="onboarding-kicker">03 / READY WHEN YOU ARE</p>
              <Typography.Heading level={1} id="onboarding-heading" tabIndex={-1}>
                Let your work speak.
              </Typography.Heading>
              <Typography.Paragraph size="sm" className="onboarding-lead">
                Your workspace is ready. Add a job to check its requirements, then choose the CV and
                projects you want to use.
              </Typography.Paragraph>
              <div className="onboarding-summary">
                <span>
                  <Icon icon="lucide:file-text" width={17} /> {cvCount}{' '}
                  {cvCount === 1 ? 'CV' : 'CVs'}
                </span>
                <span>
                  <Icon icon="lucide:folder-git-2" width={17} /> {projectCount}{' '}
                  {projectCount === 1 ? 'project' : 'projects'}
                </span>
              </div>
              <Typography.Paragraph size="sm" className="onboarding-privacy">
                <Icon icon="lucide:shield-check" width={17} />
                Your files stay on this device. AI is optional and only receives what you choose to
                share.
              </Typography.Paragraph>
              <div className="onboarding-actions">
                <Button onPress={finishWelcome}>
                  Open workspace <Icon icon="lucide:arrow-right" width={16} />
                </Button>
                <Button variant="ghost" onPress={back}>
                  Back
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
