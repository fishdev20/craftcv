import { buttonVariants } from '@heroui/styles'
import { Compare } from '@/components/Compare'
import { Hero } from '@/components/Hero'
import { Ico } from '@/components/Ico'
import { starIcons } from '@/components/star-icons'
import { ScrollScenes } from '@/components/ScrollScenes'
import { DownloadDock } from '@/components/DownloadDock'
import { FeatureList, type Feature } from '@/components/FeatureList'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { AppWindow } from '@/components/AppWindow'
import { Actions, ApplicationsBoard, Templates } from '@/components/CardMocks'
import { DOWNLOAD, REPO } from '@/lib/site'

// HeroUI's buttons on links, dressed as the site's pills
const downloadButton = `${buttonVariants({ variant: 'primary', size: 'lg' })} pill-btn pill-btn--dark`
const linkButton = `${buttonVariants({ variant: 'tertiary', size: 'md' })} pill-btn pill-btn--soft`

const features: Feature[] = [
  {
    title: 'Start from a link',
    text: 'Paste the posting’s link from LinkedIn, Indeed, Greenhouse, Lever, Ashby or Workday, or paste the text itself.',
    shot: <AppWindow src="/app/run-poster.jpg" path="New application" />,
  },
  {
    title: 'See what the job asks',
    text: 'CraftCV pulls out the must-haves and keywords, keeps them apart from the nice-to-haves, and marks the ones your CV already shows.',
    shot: <AppWindow src="/app/job-check.jpg" path="Check the job" tint="cool" />,
  },
  {
    title: 'Choose your CV and projects',
    text: 'Start from the CV you already have and pick the repositories that matter for this job. They are read on your Mac, never changed.',
    shot: <AppWindow src="/app/cv.jpg" path="Your CV" />,
  },
  {
    title: 'Proof from your own code',
    text: 'Each drafted CV line cites the file and the lines behind it, so you can open the code and check the claim yourself.',
    shot: <AppWindow src="/app/evidence.jpg" path="Evidence · Table.tsx" tint="cool" />,
  },
  {
    title: 'Keep only what you can defend',
    text: 'Approve, edit or reject each line. Requirements you can’t back up stay marked as gaps, never filled in for you.',
    shot: <AppWindow src="/app/review.jpg" path="Review" tint="warm" />,
  },
]

type Card = { label: string; text: string; visual: React.ReactNode; wide?: boolean }

const cards: Card[] = [
  {
    label: 'Templates',
    text: 'Fourteen CV templates, from a plain single column to Jake’s Resume, each one a click away and exported to PDF or Word.',
    visual: (
      <div className="feature-card__sheets ui" aria-hidden="true">
        <Templates />
      </div>
    ),
    wide: true,
  },
  {
    label: 'Tailor a CV',
    text: 'Paste the job and go: CraftCV reads the posting, your CV and your projects, then exports the result to Word or PDF.',
    visual: (
      <div className="feature-card__actions ui" aria-hidden="true">
        <Actions />
      </div>
    ),
  },
  {
    label: 'AI, if you want it',
    text: 'Matching, drafting and export work without any AI. Connect a ChatGPT plan or your own OpenAI or Anthropic key to sharpen the drafts.',
    visual: (
      <div className="feature-card__tools">
        {['logos:openai-icon', 'logos:anthropic-icon', 'simple-icons:github'].map((tool) => (
          <span key={tool}>
            <Ico name={tool} />
          </span>
        ))}
      </div>
    ),
  },
  {
    label: 'Track applications',
    text: 'Every job you prepare a CV for lands on one board. Move it from preparing to applied, interviewing and offer as you hear back, and open its CV again in a click.',
    visual: (
      <AppWindow path="Applications" className="feature-card__shot">
        <ApplicationsBoard />
      </AppWindow>
    ),
    wide: true,
  },
]

// how CraftCV behaves out of the box, as the app ships it
const switches = [
  { label: 'Read repositories locally', on: true },
  { label: 'Change your code', on: false },
  { label: 'Ask before sending to AI', on: true },
  { label: 'Filter secrets', on: true },
  { label: 'Account required', on: false },
  { label: 'Relative paths only', on: true },
  { label: 'Upload your repositories', on: false },
]

export default function Home() {
  return (
    <>
      <ScrollScenes />
      <Nav downloadIcon={<Ico name="simple-icons:apple" />} starIcons={starIcons} />
      <main className="home" id="main">
        {/* the sky and the CVs, one line of title, and the name set huge */}
        <Hero />

        <section className="home-section" id="features">
          <span className="section-label">How it works</span>
          <h2 className="section-title">
            CraftCV reads
            <br />
            between the lines
          </h2>
          <FeatureList items={features} />
        </section>

        {/* the before-and-after scene, restyled in site.css */}
        <Compare />

        <section className="home-section">
          <h2 className="section-title">
            Built for how you
            <br />
            actually apply
          </h2>
          <div className="feature-cards">
            {cards.map((card) => (
              <article key={card.label} className="feature-card" data-wide={card.wide || undefined}>
                <span className="label-pill">{card.label}</span>
                <p>{card.text}</p>
                {card.visual}
              </article>
            ))}
          </div>
        </section>

        <section className="home-section" id="privacy">
          <div className="privacy">
            <span className="privacy__lock" aria-hidden="true">
              <Ico name="lucide:lock" />
            </span>
            <h2 className="section-title">Private by default</h2>
            {/* CraftCV's real defaults, drifting past between the two lines of the title */}
            <div className="switches" aria-label="CraftCV's privacy defaults">
              <ul className="switches__track">
                {[...switches, ...switches].map((item, index) => (
                  <li key={index} aria-hidden={index >= switches.length || undefined}>
                    <i data-on={item.on || undefined} />
                    {item.label}
                    <b>{item.on ? 'On' : 'Off'}</b>
                  </li>
                ))}
              </ul>
            </div>
            <p className="section-title privacy__second" aria-hidden="true">
              with your code on your Mac
            </p>
            <p>
              CraftCV reads your repositories on your Mac and never changes them. Your CVs and
              applications live in a folder you own, with no account and no CraftCV server.
            </p>
            <p>
              When you ask AI for help, you see exactly what will be sent first: a few short
              snippets, relative paths only, secrets filtered.
            </p>
            <a className={linkButton} href={REPO}>
              Read the code on GitHub
              <Ico name="lucide:arrow-right" />
            </a>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="privacy__mark" src="/logo.svg" alt="" width={34} height={34} />
          </div>
        </section>

        <section className="ready">
          <h2 className="section-title">Ready for your next application?</h2>
        </section>

        {/* the download: held at the foot of the screen, then landing above the footer */}
        <DownloadDock>
          <a className={downloadButton} href={DOWNLOAD}>
            Download CraftCV for free
            <Ico name="lucide:arrow-down" />
          </a>
        </DownloadDock>
      </main>

      <Footer />
    </>
  )
}
