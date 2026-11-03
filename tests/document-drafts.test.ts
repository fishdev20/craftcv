// @vitest-environment jsdom
import { afterEach, it, expect, vi } from 'vitest'
import {
  editDraft,
  flushDraft,
  forgetDraft,
  openDraft,
  useDocuments,
} from '../src/renderer/features/documents/drafts-store'
import { textDocument } from '../src/shared/document'
import type { Resume } from '../src/shared/contracts'
const resume: Resume = {
  id: 'test',
  name: 'Resume',
  text: '',
  document: textDocument(''),
  revision: 0,
  updatedAt: null,
}
afterEach(() => {
  forgetDraft('test')
  vi.restoreAllMocks()
})
it('serializes edits made while an earlier save is still pending', async () => {
  let resolveFirst: (value: unknown) => void = () => {}
  const save = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve
        }),
    )
    .mockImplementationOnce(async (request) => ({
      ok: true,
      value: { ...resume, ...request, revision: 2 },
    }))
  window.craftcv = { saveResume: save } as unknown as Window['craftcv']
  openDraft(resume)
  editDraft('test', { name: 'First' })
  const saving = flushDraft('test')
  editDraft('test', { name: 'Latest' })
  resolveFirst({ ok: true, value: { ...resume, name: 'First', revision: 1 } })
  await saving
  expect(save).toHaveBeenCalledTimes(2)
  expect(save.mock.calls[1][0]).toMatchObject({ name: 'Latest', revision: 1 })
  expect(useDocuments.getState().drafts.test).toMatchObject({
    dirty: false,
    resume: { name: 'Latest', revision: 2 },
  })
})
it('retains failed drafts and retries without claiming a successful save', async () => {
  const save = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, error: 'Disk full' })
    .mockResolvedValueOnce({ ok: true, value: { ...resume, name: 'Keep this', revision: 1 } })
  window.craftcv = { saveResume: save } as unknown as Window['craftcv']
  openDraft(resume)
  editDraft('test', { name: 'Keep this' })
  await expect(flushDraft('test')).rejects.toThrow('Disk full')
  expect(useDocuments.getState().drafts.test).toMatchObject({
    dirty: true,
    error: 'Disk full',
    resume: { name: 'Keep this' },
  })
  openDraft(resume)
  expect(useDocuments.getState().drafts.test.resume.name).toBe('Keep this')
  await flushDraft('test')
  expect(useDocuments.getState().drafts.test.dirty).toBe(false)
})
