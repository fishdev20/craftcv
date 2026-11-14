// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { Dashboard } from '../src/shared/contracts'
import { useAppStore } from '../src/renderer/common/store/app-store'
import {
  finishWelcome,
  replayOnboarding,
  shouldWelcome,
  useOnboardingStore,
} from '../src/renderer/features/onboarding/onboarding'
import Welcome from '../src/renderer/features/onboarding/Welcome'

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

it('collects the starting sources before opening the workspace', () => {
  useOnboardingStore.setState({ welcomed: false, forceShow: false })
  useAppStore.setState({ dashboard: empty, busy: false })
  render(
    <MemoryRouter>
      <Welcome />
    </MemoryRouter>,
  )
  expect(screen.getByRole('heading', { name: 'Your work deserves to be seen.' })).toBeTruthy()
  expect(document.querySelector('[data-hairline="documents"][data-active="true"]')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Get started/ }))
  expect(window.localStorage.getItem('craftcv-setup-started')).toBe('true')
  expect(screen.getByRole('heading', { name: 'Start with your CV.' })).toBeTruthy()
  expect(document.querySelector('[data-hairline="cv-sheet"][data-active="true"]')).toBeTruthy()
  expect(
    shouldWelcome(
      { ...empty, resumes: [{ id: 'cv', name: 'CV' }] },
      false,
      useOnboardingStore.getState().forceShow,
    ),
  ).toBe(true)
  expect(screen.getByRole('button', { name: 'Import CV' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Do this later/ }))
  expect(screen.getByRole('heading', { name: 'Show the work behind it.' })).toBeTruthy()
  expect(
    document.querySelector('[data-hairline="project-folder"][data-active="true"]'),
  ).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Add project folder' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Do this later/ }))
  expect(screen.getByRole('heading', { name: 'Let your work speak.' })).toBeTruthy()
  expect(document.querySelector('[data-hairline="draft-press"][data-active="true"]')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /Open workspace/ }))
  expect(window.localStorage.getItem('craftcv-welcomed')).toBe('true')
  expect(window.localStorage.getItem('craftcv-setup-started')).toBeNull()
  expect(useOnboardingStore.getState().welcomed).toBe(true)
})

it('replays setup from Settings, even with work saved', () => {
  const saved = { ...empty, resumes: [{ id: 'cv', name: 'CV' }] }
  finishWelcome()
  expect(shouldWelcome(saved, useOnboardingStore.getState().welcomed)).toBe(false)
  replayOnboarding()
  const { welcomed, forceShow } = useOnboardingStore.getState()
  expect(shouldWelcome(saved, welcomed, forceShow)).toBe(true)
  expect(window.localStorage.getItem('craftcv-setup-started')).toBe('true')
  expect(window.localStorage.getItem('craftcv-welcomed')).toBeNull()
  finishWelcome()
  expect(useOnboardingStore.getState().forceShow).toBe(false)
})
