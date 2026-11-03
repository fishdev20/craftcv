// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Dashboard } from '../src/shared/contracts'
import { useAppStore } from '../src/renderer/common/store/app-store'
import {
  finishWelcome,
  replayOnboarding,
  setupProgress,
  shouldWelcome,
  useOnboardingStore,
} from '../src/renderer/features/onboarding/onboarding'
import Workspace from '../src/renderer/features/workspace/WorkspacePage'

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
Element.prototype.getAnimations ??= () => []

const empty: Dashboard = {
  projects: [],
  repositories: [],
  resumes: [],
  sessions: [],
  applications: [],
  keys: { openai: false, chatgpt: false, anthropic: false },
  chatgpt: { connected: false, email: null, models: [] },
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

it('welcomes only a new install that has not seen the welcome', () => {
  expect(shouldWelcome(empty, false)).toBe(true)
  expect(shouldWelcome(empty, true)).toBe(false)
  expect(shouldWelcome(null, false)).toBe(false)
  // someone with saved work is not new, whatever this device remembers
  expect(shouldWelcome({ ...empty, resumes: [{ id: 'cv', name: 'CV' }] }, false)).toBe(false)
})

it('ticks setup off from what is saved', () => {
  expect(setupProgress(empty)).toEqual({ cv: false, project: false, ai: false, application: false })
  expect(
    setupProgress({
      ...empty,
      resumes: [{ id: 'cv', name: 'CV' }],
      keys: { ...empty.keys, anthropic: true },
    }),
  ).toEqual({ cv: true, project: false, ai: true, application: false })
  expect(setupProgress({ ...empty, chatgpt: { ...empty.chatgpt, connected: true } }).ai).toBe(true)
})

it('shows the welcome once, then the wizard with the setup checklist', () => {
  useOnboardingStore.setState({ welcomed: false, setupHidden: false })
  useAppStore.setState({ dashboard: empty, busy: false })
  const view = () =>
    render(
      <MemoryRouter>
        <Workspace />
      </MemoryRouter>,
    )
  view()
  expect(screen.getByRole('heading', { name: 'Welcome to CraftCV' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Get started/ }))
  expect(screen.queryByRole('heading', { name: 'Welcome to CraftCV' })).toBeNull()
  expect(screen.getByRole('heading', { name: 'Set up CraftCV' })).toBeTruthy()
  expect(screen.getByText('0 of 4 done')).toBeTruthy()
  expect(window.localStorage.getItem('craftcv-welcomed')).toBe('true')

  // closing the checklist is remembered too
  fireEvent.click(screen.getByRole('button', { name: 'Hide setup' }))
  expect(screen.queryByRole('heading', { name: 'Set up CraftCV' })).toBeNull()
  expect(window.localStorage.getItem('craftcv-setup-hidden')).toBe('true')
})

it('replays the welcome from Settings, even with work saved', () => {
  const saved = { ...empty, resumes: [{ id: 'cv', name: 'CV' }] }
  finishWelcome({ hideSetup: true })
  expect(shouldWelcome(saved, useOnboardingStore.getState().welcomed)).toBe(false)
  replayOnboarding()
  const { welcomed, replay, setupHidden } = useOnboardingStore.getState()
  expect(shouldWelcome(saved, welcomed, replay)).toBe(true)
  expect(setupHidden).toBe(false)
  expect(window.localStorage.getItem('craftcv-welcomed')).toBeNull()
  // seeing it again ends the replay
  finishWelcome({ hideSetup: false })
  expect(useOnboardingStore.getState().replay).toBe(false)
})
