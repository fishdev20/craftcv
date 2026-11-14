import type { Metadata } from 'next'
import { Ico } from '@/components/Ico'
import { starIcons } from '@/components/star-icons'
import { Release } from '@/components/Release'
import { SkyScene } from '@/components/SkyScene'
import { Footer } from '@/components/Footer'
import { Nav } from '@/components/Nav'

export const metadata: Metadata = {
  title: 'Download CraftCV',
  description: 'Download CraftCV for macOS on Apple Silicon or Intel, or for Linux as an AppImage.',
}

const icons = {
  apple: <Ico name="logos:apple" />,
  linux: <Ico name="logos:linux-tux" />,
  github: <Ico name="simple-icons:github" />,
  download: <Ico name="lucide:download" />,
  clock: <Ico name="lucide:clock" />,
}

/** The release page: the latest builds, read from GitHub when the page opens. */
export default function DownloadPage() {
  return (
    <>
      <Nav downloadIcon={<Ico name="simple-icons:apple" />} starIcons={starIcons} />
      <main id="main">
        <section className="download on-sky" id="top">
          <SkyScene />
          <div className="wrap">
            <div className="download__body">
              <div className="download__text">
                <h1>Download CraftCV</h1>
                <p className="hero__lead">
                  Free and open source, for macOS on Apple Silicon or Intel and for Linux. Builds
                  come straight from the project’s GitHub releases.
                </p>
              </div>
              <Release icons={icons} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
