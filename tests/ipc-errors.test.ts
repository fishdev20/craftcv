import { it, expect, vi } from 'vitest'
import { z } from 'zod'

vi.mock('electron', () => ({ ipcMain: { handle: vi.fn() } }))
const { ipcMain } = await import('electron')
const { createHandle, errorMessage } = await import('../src/main/ipc/handle')
const { providerError } = await import('../src/main/ai/provider-errors')

it('never shows internal field paths for data that failed validation inside a handler', () => {
  const failure = z.object({ response: z.object({ usage: z.number() }) }).safeParse({
    response: { usage: null },
  })
  const message = errorMessage(failure.error)
  expect(message).not.toContain('response.usage')
  expect(message).toContain('unexpected format')
  expect(errorMessage(new Error('Project not found.'))).toBe('Project not found.')
})

it('turns operating-system file errors, including those relayed by workers, into plain words', () => {
  const thrown = Object.assign(new Error("ENOENT: no such file or directory, stat '/tmp/cv.pdf'"), {
    code: 'ENOENT',
  })
  expect(errorMessage(thrown)).toBe(
    'The file or folder could not be found. It may have been moved or deleted.',
  )
  // a worker posts only the message text
  expect(errorMessage(new Error("EACCES: permission denied, open '/x'"))).toContain('permission')
  expect(errorMessage(new Error('UPPERCASE words: are fine'))).toBe('UPPERCASE words: are fine')
})

it('sends a ChatGPT plan limit with links to the plan and usage pages', async () => {
  createHandle(() => {})('limited', z.undefined(), () => {
    throw providerError('chatgpt', { code: 'subscription_sharing_usage_limit_exceeded' })
  })
  const serve = vi.mocked(ipcMain.handle).mock.calls.at(-1)![1]
  const result = await serve({} as never, undefined)
  expect(result).toMatchObject({
    ok: false,
    error: expect.stringContaining('You’re out of ChatGPT plan messages'),
    pages: ['chatgpt-plans', 'chatgpt-usage'],
  })
  expect(providerError('openai', { code: 'rate_limit_exceeded' })).not.toHaveProperty('pages')
})
