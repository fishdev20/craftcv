import { Ico } from './Ico'

// a key to the marks on the tailored page, each shown as it appears there
const key = [
  { mark: <mark>React</mark>, text: 'Keywords from the posting, in lines you already had' },
  {
    mark: <span className="key__plain">Arbor</span>,
    text: 'Lines with no proof stay as you wrote them',
  },
]

type Line = { text: React.ReactNode }
type Version = {
  role: string
  summary: React.ReactNode
  northwind: Line[]
  arbor: Line[]
  skills: React.ReactNode
}

// a keyword from the posting, marked as the tailored page shows it
const keyword = (text: string) => <mark>{text}</mark>

// the demo CV from the app recording, as imported and as tailored to the Halden posting
const before: Version = {
  role: 'Frontend engineer · Berlin · alex.kim@mail.example',
  summary:
    'Frontend engineer with six years of building product interfaces in React and TypeScript, with a focus on accessible, keyboard-first tools.',
  northwind: [
    { text: 'Rebuilt the billing dashboard in React and TypeScript.' },
    { text: 'Built data tables for the admin dashboard.' },
    { text: 'Wrote end-to-end tests for checkout and invoices.' },
  ],
  arbor: [
    { text: 'Shipped the onboarding flow and its form validation.' },
    { text: "Maintained the design system's component library." },
  ],
  skills: 'React, TypeScript, CSS, Testing, Node.js',
}
const after: Version = {
  role: 'Senior frontend engineer · Berlin, remote in Europe · alex.kim@mail.example',
  summary: (
    <>
      Frontend engineer with six years of building product interfaces in {keyword('React')} and{' '}
      {keyword('TypeScript')}, focused on {keyword('accessible, keyboard-first')} tools and{' '}
      {keyword('large data views')}.
    </>
  ),
  northwind: [
    {
      text: (
        <>
          Rebuilt the billing dashboard in {keyword('React')} and {keyword('TypeScript')}.
        </>
      ),
    },
    {
      text: (
        <>
          Built a {keyword('keyboard-accessible')} data grid with ARIA roles,{' '}
          {keyword('virtualised')} for large tables.
        </>
      ),
    },
    {
      text: (
        <>
          Covered checkout and invoices with {keyword('Playwright')} end-to-end tests and{' '}
          {keyword('Vitest')} unit tests.
        </>
      ),
    },
    {
      text: <>Added {keyword('screen reader')} announcements for live dashboard updates.</>,
    },
  ],
  arbor: before.arbor,
  skills: (
    <>
      {keyword('React')}, {keyword('TypeScript')}, {keyword('Accessibility (ARIA)')},{' '}
      {keyword('Vitest')}, {keyword('Playwright')}, CSS, Node.js
    </>
  ),
}

function Page({ version, label }: { version: Version; label: React.ReactNode }) {
  const lines = (items: Line[]) => (
    <ul>
      {items.map((line, index) => (
        <li key={index}>{line.text}</li>
      ))}
    </ul>
  )
  return (
    <div className="a4__page">
      <span className="a4__label">{label}</span>
      <header>
        <h3>Alex Kim</h3>
        <p>{version.role}</p>
      </header>
      <h4>Summary</h4>
      <p>{version.summary}</p>
      <h4>Experience</h4>
      <div className="a4__job">
        <b>Product engineer, Northwind</b>
        <span>2022 to now</span>
      </div>
      {lines(version.northwind)}
      <div className="a4__job">
        <b>Frontend developer, Arbor</b>
        <span>2019 to 2022</span>
      </div>
      {lines(version.arbor)}
      <h4>Skills</h4>
      <p>{version.skills}</p>
      <h4>Languages</h4>
      <p>English, German</p>
    </div>
  )
}

/**
 * The same CV page before and after tailoring, one laid over the other. The section is pinned;
 * scrolling drags the divider across the page, uncovering the tailored version from the right.
 */
export function Compare() {
  return (
    <section className="compare-section" id="compare" data-scene="pin">
      <div className="pin">
        <div className="wrap compare">
          <div className="compare__text">
            <div className="section-head">
              <span className="eyebrow">Before and after</span>
              <h2>
                One CV page, <span className="muted">tailored to the job</span>
              </h2>
              <p>Alex&apos;s CV, tailored to a Senior Frontend Engineer posting at Halden.</p>
            </div>
            <ul className="compare__key">
              {key.map((item) => (
                <li key={item.text}>
                  <span className="compare__mark">{item.mark}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
          <div className="compare__panel">
            <div className="a4" role="img" aria-label="Alex Kim's CV before and after tailoring">
              <div className="a4__frame" aria-hidden="true">
                <Page version={before} label="Before" />
                <div className="a4__after">
                  <Page
                    version={after}
                    label={
                      <>
                        <Ico name="lucide:badge-check" />
                        After
                      </>
                    }
                  />
                </div>
                <div className="a4__divider">
                  <span className="a4__handle">
                    <Ico name="lucide:chevrons-left-right" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
