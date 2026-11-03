// @vitest-environment jsdom
import { afterEach, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import {
  BRIDGE_VERSION,
  hasCurrentBridge,
  RESTART_MESSAGE,
  verifyRuntime,
} from '../src/shared/runtime'
import RuntimeGate from '../src/renderer/app/RuntimeGate'
import ResumePreview from '../src/renderer/features/library/components/ResumePreview'
afterEach(cleanup)
it('blocks an old preload before mounting pages that call unsupported methods', () => {
  window.craftcv = { dashboard: vi.fn() } as unknown as Window['craftcv']
  expect(hasCurrentBridge(window.craftcv)).toBe(false)
  render(
    <RuntimeGate>
      <p>Application ready</p>
    </RuntimeGate>,
  )
  expect(screen.getByText(RESTART_MESSAGE)).toBeTruthy()
  expect(screen.queryByText('Application ready')).toBeNull()
})
it('rejects an old main process even if the preload has been reloaded', async () => {
  const getRuntimeInfo = vi
    .fn()
    .mockRejectedValueOnce(new Error('No handler registered'))
    .mockResolvedValueOnce({ ok: true, value: { bridgeVersion: BRIDGE_VERSION + 1 } })
    .mockResolvedValueOnce({ ok: true, value: { bridgeVersion: BRIDGE_VERSION } })
  const api = { getRuntimeInfo } as unknown as Window['craftcv']
  expect(await verifyRuntime(api)).toBe(false)
  expect(await verifyRuntime(api)).toBe(false)
  expect(await verifyRuntime(api)).toBe(true)
})
it('replaces a failed preview with a retry action and loads the CV on retry', async () => {
  const getResume = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, error: 'Could not read CV.' })
    .mockResolvedValueOnce({ ok: true, value: { text: 'Saved experience' } })
  window.craftcv = { getResume } as unknown as Window['craftcv']
  render(<ResumePreview id="resume" name="CV.pdf" />)
  fireEvent.click(screen.getByRole('button', { name: 'CV.pdf' }))
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Could not read CV.')
  expect(screen.queryByText('Loading CV…')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Retry preview' }))
  expect(await screen.findByText('Saved experience')).toBeTruthy()
})
it('shows restart guidance rather than an endless spinner for a missing getResume', async () => {
  window.craftcv = {} as Window['craftcv']
  render(<ResumePreview id="resume" name="CV.pdf" />)
  fireEvent.click(screen.getByRole('button', { name: 'CV.pdf' }))
  expect(await screen.findByText(RESTART_MESSAGE)).toBeTruthy()
  expect(screen.queryByText('Loading CV…')).toBeNull()
})
