'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { buttonVariants } from '@heroui/styles'
import { GitHubStars } from './GitHubStars'
import { DOWNLOAD } from '@/lib/site'

/**
 * A small floating pill of links at the top, ending in the GitHub star button, and a
 * download pill that slides in at the top right once the hero has scrolled away.
 */
export function Nav({
  downloadIcon,
  starIcons,
}: {
  downloadIcon: React.ReactNode
  starIcons: { github: React.ReactNode; star: React.ReactNode }
}) {
  const [pastHero, setPastHero] = useState(false)

  useEffect(() => {
    const update = () => setPastHero(window.scrollY > window.innerHeight * 0.8)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <>
      <nav className="nav" aria-label="Main">
        <Link className="nav__mark" href="/" aria-label="CraftCV home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={28} height={28} />
          <span aria-hidden="true">CraftCV</span>
        </Link>
        <Link href="/#features">Features</Link>
        <Link href="/#privacy">Privacy</Link>
        <GitHubStars icons={starIcons} />
      </nav>
      <a
        className={`${buttonVariants({ variant: 'tertiary', size: 'md' })} float-download`}
        href={DOWNLOAD}
        data-shown={pastHero || undefined}
        tabIndex={pastHero ? 0 : -1}
        aria-hidden={!pastHero}
      >
        {downloadIcon}
        Download CraftCV
      </a>
    </>
  )
}
