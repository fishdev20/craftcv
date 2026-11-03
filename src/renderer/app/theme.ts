import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const themeKey = 'craftcv-theme'

/** The saved theme, else the system's. */
export function initialTheme(): Theme {
  const saved = window.localStorage.getItem(themeKey)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Sets the theme on <html>, where both the app's tokens and HeroUI read it. */
export function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark', 'default')
  root.classList.add(theme)
  root.dataset.theme = theme
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(themeKey, theme)
  }, [theme])
  return [theme, setTheme] as const
}
