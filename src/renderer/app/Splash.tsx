import { Typography } from '@heroui/react'
import { useEffect, useState } from 'react'
import Logo from '@/common/ui/Logo'
import { PressFigure } from '@/common/ui/Loading'
import { useAppStore } from '@/common/store/app-store'

const MIN_MS = 2200,
  MAX_MS = 6000,
  FADE_MS = 400

/**
 * The launch screen. The app mounts and loads underneath it; the splash leaves once it has
 * been shown for MIN_MS and the first dashboard load has settled (or after MAX_MS), or as
 * soon as the person clicks or presses a key.
 */
export default function Splash() {
  const settled = useAppStore((s) => s.dashboard !== null || s.error !== null)
  const [minDone, setMinDone] = useState(false),
    [maxDone, setMaxDone] = useState(false),
    [skipped, setSkipped] = useState(false),
    [gone, setGone] = useState(false)
  const leaving = skipped || (minDone && (settled || maxDone))
  useEffect(() => {
    const min = setTimeout(() => setMinDone(true), MIN_MS),
      max = setTimeout(() => setMaxDone(true), MAX_MS)
    const skip = () => setSkipped(true)
    window.addEventListener('keydown', skip)
    return () => {
      clearTimeout(min)
      clearTimeout(max)
      window.removeEventListener('keydown', skip)
    }
  }, [])
  useEffect(() => {
    if (gone) return
    // the app scrolls underneath; keep its scrollbar out of the launch screen
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [gone])
  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => setGone(true), FADE_MS)
    return () => clearTimeout(timer)
  }, [leaving])
  if (gone) return null
  return (
    <div
      className="splash"
      data-leaving={leaving || undefined}
      // visual only: the app is mounted and readable underneath, so this is not a second live region
      aria-hidden="true"
      onClick={() => setSkipped(true)}
    >
      <div className="splash-brand">
        <Logo size={40} />
        CraftCV
      </div>
      <PressFigure />
      <Typography.Paragraph size="sm" className="splash-tagline">
        Let your work speak.
      </Typography.Paragraph>
      <Typography.Paragraph size="sm" className="splash-hint">
        Loading your local workspace…
      </Typography.Paragraph>
    </div>
  )
}
