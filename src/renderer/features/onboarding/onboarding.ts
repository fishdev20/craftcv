import { create } from 'zustand'
import type { Dashboard } from '@shared/contracts'

const welcomedKey = 'craftcv-welcomed'
const setupHiddenKey = 'craftcv-setup-hidden'

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
    // nothing was kept
  }
}

interface OnboardingState {
  /** The welcome was seen, started from or skipped. */
  welcomed: boolean
  /** The setup checklist was closed. */
  setupHidden: boolean
  /** Asked for again from Settings: the welcome shows even with work already saved. */
  replay: boolean
}

// `npm run dev:onboarding` starts as a first run: the welcome and the full checklist show,
// whatever this device remembers and whatever is saved. Saved work is left as it is.
const firstRun = import.meta.env.DEV && import.meta.env.MODE === 'onboarding'

export const useOnboardingStore = create<OnboardingState>(() => ({
  welcomed: !firstRun && read(welcomedKey),
  setupHidden: !firstRun && read(setupHiddenKey),
  replay: firstRun,
}))

export function finishWelcome({ hideSetup }: { hideSetup: boolean }) {
  write(welcomedKey)
  if (hideSetup) write(setupHiddenKey)
  useOnboardingStore.setState({
    welcomed: true,
    replay: false,
    ...(hideSetup && { setupHidden: true }),
  })
}

export function hideSetup() {
  write(setupHiddenKey)
  useOnboardingStore.setState({ setupHidden: true })
}

/** Shows the welcome and the setup checklist again, whatever is already saved. */
export function replayOnboarding() {
  forget(welcomedKey)
  forget(setupHiddenKey)
  useOnboardingStore.setState({ welcomed: false, setupHidden: false, replay: true })
}

/**
 * A new install (nothing saved yet, and the welcome not seen on this device), or a replay
 * asked for from Settings.
 */
export const shouldWelcome = (dashboard: Dashboard | null, welcomed: boolean, replay = false) =>
  !welcomed &&
  !!dashboard &&
  (replay ||
    (!dashboard.resumes.length && !dashboard.projects.length && !dashboard.applications.length))

export type SetupItem = 'cv' | 'project' | 'ai' | 'application'

/** What a good first result needs, and which of it is done, read from what is saved. */
export function setupProgress(dashboard: Dashboard): Record<SetupItem, boolean> {
  return {
    cv: dashboard.resumes.length > 0,
    project: dashboard.projects.length > 0,
    ai: dashboard.chatgpt.connected || Object.values(dashboard.keys).some(Boolean),
    application: dashboard.applications.length > 0,
  }
}
