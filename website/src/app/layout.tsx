import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif, JetBrains_Mono, Newsreader } from 'next/font/google'
import { SmoothScroll } from '@/components/SmoothScroll'
import './globals.css'
import './site.css'

// the name in Instrument Serif italic, text in Inter (all four faces SIL Open Font License, served by next/font)
const display = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument',
})
const body = Inter({ subsets: ['latin'], variable: '--font-inter' })
// the page's text serif with an italic, and a small mono for labels
const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
})
const mono = JetBrains_Mono({ subsets: ['latin'], weight: '400', variable: '--font-jetbrains' })

const description =
  'CraftCV is a free, open-source desktop app that tailors your CV to each job and cites the code in your own repositories behind every line.'

export const metadata: Metadata = {
  title: 'CraftCV: CV tailoring backed by your own code',
  description,
  icons: { icon: '/logo.svg' },
  openGraph: { title: 'CraftCV', description, type: 'website' },
  other: { 'page-type': 'software', 'site-kind': 'software' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#eaf3ff',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-type="software"
      data-radius="soft"
      data-motion=""
      className={`${display.variable} ${body.variable}`}
    >
      <head>
        {/* the design-taste skill's hover and press layer, unchanged */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/motion.css" />
      </head>
      <body>
        <SmoothScroll />
        {/* every page's styles are scoped under .site (site.css) */}
        <div className={`site ${serif.variable} ${mono.variable}`}>{children}</div>
      </body>
    </html>
  )
}
