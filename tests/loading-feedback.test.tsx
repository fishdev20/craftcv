// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { CraftAPI, JobImport, Result } from '../src/shared/contracts'
import Topbar from '../src/renderer/app/layout/Topbar'
import { useAppStore } from '../src/renderer/common/store/app-store'
import JobLinkField from '../src/renderer/features/workspace/context/JobLinkField'

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
Element.prototype.getAnimations ??= () => []

afterEach(() => {
  cleanup()
  useAppStore.setState({ busy: false, progress: null })
})

it('keeps job import progress at its button rather than in the header', async () => {
  let finish!: (result: Result<JobImport>) => void
  const importJobLink = vi.fn(() => new Promise<Result<JobImport>>((resolve) => (finish = resolve)))
  window.craftcv = { importJobLink } as unknown as CraftAPI
  useAppStore.setState({ busy: false })

  render(
    <MemoryRouter>
      <Topbar collapsed={false} onToggleSidebar={() => {}} />
      <JobLinkField />
    </MemoryRouter>,
  )

  fireEvent.change(screen.getByRole('textbox', { name: 'Job posting link' }), {
    target: { value: 'https://jobs.example.com/123' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Import' }))
  expect((screen.getByRole('button', { name: 'Importing…' }) as HTMLButtonElement).disabled).toBe(
    true,
  )
  expect(screen.queryByText('Working on your request')).toBeNull()
  expect(screen.queryByText('Local workspace')).toBeNull()

  await act(async () => {
    finish({
      ok: true,
      value: {
        text: 'Backend engineer at Example\n\nBuild reliable APIs.',
        title: 'Backend engineer',
        company: 'Example',
        location: null,
        url: 'https://jobs.example.com/123',
        fromPage: false,
      },
    })
  })
  expect(importJobLink).toHaveBeenCalledWith('https://jobs.example.com/123')
  expect(screen.getByRole('button', { name: 'Import' })).toBeTruthy()
})
