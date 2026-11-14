import { Ico } from './Ico'
import { SkyScene } from './SkyScene'

/**
 * The first screen: the sky, one line of title, the name set huge, and the CVs rising over it
 * from the bottom of the sky.
 */
export function Hero() {
  return (
    <section className="hero hero--simple on-sky" id="top" data-scene="exit">
      <SkyScene />
      <div className="wrap">
        <h1 className="hero__title">Tailor every CV. Prove every line.</h1>
        <p className="hero__word" aria-hidden="true">
          CraftCV
        </p>
        <div className="hero-visual" aria-hidden="true">
          <HeroDocument />
        </div>
      </div>
    </section>
  )
}

/**
 * A drawn face in the avatar circle. The faces are DiceBear's Notionists (art by Zoish, CC0),
 * generated once into public/avatars, so nothing loads from a third party.
 */
function Face({ src, small = false }: { src: string; small?: boolean }) {
  const size = small ? 32 : 40
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`avatar avatar--face${small ? ' avatar--sm' : ''}`}
      src={src}
      alt=""
      width={size}
      height={size}
    />
  )
}

/** A side CV behind the tailored one: a name, a role and quiet lines. */
function SideCv({
  side,
  face,
  name,
  role,
}: {
  side: 'left' | 'right'
  face: string
  name: string
  role: string
}) {
  return (
    <div className={`cv cv--${side}`}>
      <div className="cv__head">
        <Face src={face} small />
        <div>
          <div className="ui-name">{name}</div>
          <span className="cv__bar" />
        </div>
        <span className="ui-sub cv__role">{role}</span>
      </div>
      <div className="cv__block">
        <span className="ui-label">Professional summary</span>
        <span className="ph" style={{ width: '92%' }} />
        <span className="ph" style={{ width: '84%' }} />
        <span className="ph" style={{ width: '70%' }} />
      </div>
      <div className="cv__block">
        <span className="ui-label">Experience</span>
        <span className="ph ph--strong" style={{ width: '56%' }} />
        <span className="ph" style={{ width: '88%' }} />
        <span className="ph" style={{ width: '76%' }} />
        <span className="ph" style={{ width: '82%' }} />
        <span className="ph" style={{ width: '64%' }} />
      </div>
    </div>
  )
}

/** A stack of CVs: the tailored one in front, two more behind, sinking into the clouds. */
function HeroDocument() {
  return (
    <div className="ui cv-stack">
      <SideCv
        side="left"
        face="/avatars/priya-shah.svg"
        name="Priya Shah"
        role="Backend engineer"
      />
      <SideCv side="right" face="/avatars/sam-lee.svg" name="Sam Lee" role="Data engineer" />

      <div className="cv cv--front">
        <div className="cv__head">
          <Face src="/avatars/alex-kim.svg" />
          <div>
            <div className="ui-name">Alex Kim</div>
            <div className="ui-sub">alex.kim@mail.example</div>
            <span className="cv__bar" />
          </div>
          <span className="ui-sub cv__role">Frontend engineer</span>
        </div>
        <div className="cv__meta ui-sub">
          <Ico name="lucide:map-pin" /> Berlin · github.com/alexkim
        </div>
        <div className="cv__block">
          <span className="ui-label">Professional summary</span>
          <p className="cv__text">
            Frontend engineer with six years of building product interfaces in React and TypeScript,
            with a focus on accessible, keyboard-first tools.
          </p>
        </div>
        <div className="cv__block">
          <span className="ui-label">Experience</span>
          <span className="ui-name">Product engineer, Northwind</span>
          <span className="cv__when">Berlin · 2022 to now</span>
          <div className="doc__line">
            <span>
              Rebuilt the billing dashboard in <b>React</b> and <b>TypeScript</b>.
            </span>
          </div>
          <div className="doc__line doc__line--new">
            <span>
              Built <mark>keyboard-accessible</mark> data tables with <mark>ARIA grid</mark> roles
              and <mark>virtualised</mark> rows.
            </span>
          </div>
          <div className="doc__line">
            <span>Wrote end-to-end tests in Playwright for checkout and invoices.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
