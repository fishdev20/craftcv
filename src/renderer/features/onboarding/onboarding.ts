import { create } from 'zustand'
import type { Dashboard } from '@shared/contracts'

const welcomedKey = 'craftcv-welcomed'
const setupStartedKey = 'craftcv-setup-started'

// per-device conveniences: without storage the welcome simply shows again next time
function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === 'true'
  } catch {
    return false
  }
}
function write(key: string) {
  try {
    window.localStorage.setItem(key, 'true')
  } catch {
    // kept for this run only
  }
}
function forget(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // kept for this run only
  }
}
interface OnboardingState {
  /** The first-run setup was completed or skipped. */
  welcomed: boolean
  /** Keep setup open after an import, or when reopened from Settings. */
  forceShow: boolean
}

// `npm run dev:onboarding` starts as a first run without changing saved work.
const firstRun = import.meta.env.DEV && import.meta.env.MODE === 'onboarding'

export const useOnboardingStore = create<OnboardingState>(() => ({
  welcomed: !firstRun && read(welcomedKey),
  forceShow: firstRun || read(setupStartedKey),
}))

export function beginWelcome() {
  write(setupStartedKey)
  useOnboardingStore.setState({ forceShow: true })
}

export function finishWelcome() {
  write(welcomedKey)
  forget(setupStartedKey)
  useOnboardingStore.setState({
    welcomed: true,
    forceShow: false,
  })
}

/** Shows first-run setup again, whatever is already saved. */
export function replayOnboarding() {
  forget(welcomedKey)
  write(setupStartedKey)
  useOnboardingStore.setState({ welcomed: false, forceShow: true })
}

/**
 * A new install (nothing saved yet, and the welcome not seen on this device), or a replay
 * asked for from Settings.
 */
export const shouldWelcome = (dashboard: Dashboard | null, welcomed: boolean, forceShow = false) =>
  !welcomed &&
  !!dashboard &&
  (forceShow ||
    (!dashboard.resumes.length && !dashboard.projects.length && !dashboard.applications.length))
