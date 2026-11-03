import { afterEach, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { generate } from '../src/main/ai/cv-bullets'
import { analyzeProjectWithAI } from '../src/main/ai/project-understanding'
import { parseReply } from '../src/main/ai/structured-request'
import type { Session, GenerateRequest } from '../src/shared/contracts'
const session: Session = {
  id: 'session',
  createdAt: '',
  job: 'React developer',
  requirements: ['React'],
  evidence: [
    {
      id: 'e1',
      repositoryId: 'r',
      path: 'app.tsx',
      line: 1,
      snippet: 'import React from "react"',
      skills: ['React'],
      hash: 'h',
    },
  ],
  suggestions: [],
  stats: { files: 1, bytes: 50, cached: 0, skipped: 0, capped: false, durationMs: 1 },
  usage: null,
  resumeId: null,
}
const request: GenerateRequest = {
  sessionId: 'session',
  provider: 'openai',
  model: 'gpt-4o-mini',
  consent: true,
  tokenBudget: null,
}
afterEach(() => vi.unstubAllGlobals())

it('accepts valid structured JSON wrapped by a model', () => {
  const schema = z.object({ summary: z.string() })
  expect(parseReply(schema, '```json\n{"summary":"Service map"}\n```')).toEqual({
    summary: 'Service map',
  })
  expect(parseReply(schema, 'Here is the requested JSON:\n{"summary":"Service map"}')).toEqual({
    summary: 'Service map',
  })
})

it('sends bounded structured requests and reports provider usage', async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  bullets: [
                    { text: 'Worked with React', requirement: 'React', evidenceIds: ['e1'] },
                  ],
                }),
              },
            ],
          },
        ],
        usage: { input_tokens: 20, output_tokens: 30 },
      }),
    ),
  )
  vi.stubGlobal('fetch', fetcher)
  const result = await generate(request, session, 'CV', 'test-key', new AbortController().signal)
  expect(result.usage).toEqual({ input: 20, output: 30 })
  const body = JSON.parse(fetcher.mock.calls[0][1].body)
  expect(body.store).toBe(false)
  expect(body.text.format.strict).toBe(true)
})
it('uses the required streaming contract for ChatGPT plan requests', async () => {
  const resultText = JSON.stringify({
    bullets: [{ text: 'Worked with React', requirement: 'React', evidenceIds: ['e1'] }],
  })
  const stream = [
    `data: ${JSON.stringify({ type: 'response.output_text.delta', delta: resultText })}`,
    `data: ${JSON.stringify({
      type: 'response.completed',
      response: { usage: { input_tokens: 12, output_tokens: 8 } },
    })}`,
    'data: [DONE]',
  ].join('\n\n')
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }))
  vi.stubGlobal('fetch', fetcher)
  const result = await generate(
    { ...request, provider: 'chatgpt', model: 'gpt-6.1-sol' },
    session,
    '',
    'oauth-token',
    new AbortController().signal,
  )
  expect(result.usage).toEqual({ input: 12, output: 8 })
  const body = JSON.parse(fetcher.mock.calls[0][1].body)
  expect(body.store).toBe(false)
  expect(body.stream).toBe(true)
  expect(body.input).toEqual([{ role: 'user', content: expect.any(String) }])
  expect(body).not.toHaveProperty('max_output_tokens')
})
it('does not send a request when the budget is too small', async () => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  await expect(
    generate({ ...request, tokenBudget: 1000 }, session, '', 'key', new AbortController().signal),
  ).rejects.toThrow('budget')
  expect(fetcher).not.toHaveBeenCalled()
})
it('rejects malformed JSON from the provider', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ content: [{ type: 'text', text: '{"bullets":[{"text":42}]}' }] }),
        ),
      ),
  )
  await expect(
    generate(
      { ...request, provider: 'anthropic' },
      session,
      '',
      'key',
      new AbortController().signal,
    ),
  ).rejects.toThrow()
})

it('creates a structured project map and drops invented evidence paths', async () => {
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({
                  summary: 'One project containing an API service.',
                  architecture: 'Service-oriented application.',
                  technologies: ['TypeScript'],
                  services: [
                    {
                      name: 'api',
                      purpose: 'Provides HTTP endpoints.',
                      evidencePaths: ['api/README.md', 'api/invented.txt'],
                    },
                  ],
                  integrations: [],
                  unknowns: ['Runtime topology is not documented.'],
                }),
              },
            ],
          },
        ],
        usage: { input_tokens: 40, output_tokens: 25 },
      }),
    ),
  )
  vi.stubGlobal('fetch', fetcher)
  const result = await analyzeProjectWithAI(
    {
      projectId: crypto.randomUUID(),
      provider: 'openai',
      model: 'gpt-4o-mini',
      consent: true,
      tokenBudget: null,
    },
    {
      project: { name: 'Kaira' },
      services: [{ name: 'api' }],
      documents: [{ service: 'api', path: 'README.md', text: 'HTTP API in TypeScript.' }],
      truncated: false,
    },
    'key',
    new AbortController().signal,
  )
  expect(result.services[0].evidencePaths).toEqual(['api/README.md'])
  expect(result.usage).toEqual({ input: 40, output: 25 })
  const body = JSON.parse(fetcher.mock.calls[0][1].body)
  expect(body.store).toBe(false)
  expect(body.text.format.name).toBe('project_understanding')
})

it('reads a ChatGPT stream whose lifecycle events carry null usage and errors', async () => {
  const resultText = JSON.stringify({
    bullets: [{ text: 'Worked with React', requirement: 'React', evidenceIds: ['e1'] }],
  })
  const lifecycle = { usage: null, error: null, status: 'in_progress' }
  const stream = [
    { type: 'response.created', response: lifecycle },
    { type: 'response.in_progress', response: lifecycle },
    { type: 'response.output_item.added', item: { type: 'message' } },
    { type: 'response.output_text.delta', delta: resultText },
    { type: 'response.output_text.done', text: resultText },
    { type: 'response.completed', response: { ...lifecycle, status: 'completed' } },
  ]
    .map((event) => `data: ${JSON.stringify(event)}`)
    .join('\n\n')
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }),
      ),
  )
  const result = await generate(
    { ...request, provider: 'chatgpt', model: 'gpt-6.1-sol' },
    session,
    '',
    'oauth-token',
    new AbortController().signal,
  )
  expect(result.data.bullets).toHaveLength(1)
  expect(result.usage).toBeNull()
})

it('explains an AI reply in the wrong shape in words a person can act on', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ content: [{ type: 'text', text: '{"bullets":[{"text":42}]}' }] }),
        ),
      ),
  )
  await expect(
    generate(
      { ...request, provider: 'anthropic' },
      session,
      '',
      'key',
      new AbortController().signal,
    ),
  ).rejects.toThrow('The AI reply was not in the expected format.')
})

it('explains when a provider cuts off structured output', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'incomplete',
          incomplete_details: { reason: 'max_output_tokens' },
          output: [{ content: [{ type: 'output_text', text: '{"bullets":[' }] }],
        }),
      ),
    ),
  )
  await expect(generate(request, session, '', 'key', new AbortController().signal)).rejects.toThrow(
    'reply was cut off',
  )
})

it('explains a ChatGPT plan usage limit with the time it resets', async () => {
  const resetsAt = new Date()
  resetsAt.setHours(17, 44, 0, 0)
  if (resetsAt.getTime() < Date.now()) resetsAt.setDate(resetsAt.getDate() + 1)
  const stream = [
    { type: 'response.created', response: { usage: null, error: null } },
    {
      type: 'response.failed',
      response: {
        usage: null,
        error: {
          code: 'subscription_sharing_usage_limit_exceeded',
          message: 'usage limit',
          resets_at: Math.floor(resetsAt.getTime() / 1000),
        },
      },
    },
  ]
    .map((event) => `data: ${JSON.stringify(event)}`)
    .join('\n\n')
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } }),
      ),
  )
  const failure = generate(
    { ...request, provider: 'chatgpt', model: 'gpt-6.1-sol' },
    session,
    '',
    'oauth-token',
    new AbortController().signal,
  )
  const time = resetsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  await expect(failure).rejects.toThrow('You’re out of ChatGPT plan messages\n')
  await expect(failure).rejects.toThrow(time)
  await expect(failure).rejects.not.toThrow('subscription_sharing')
})

it('turns an HTTP error body into plain words', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ type: 'error', error: { type: 'authentication_error', message: 'x' } }),
          { status: 401 },
        ),
      ),
  )
  await expect(
    generate(
      { ...request, provider: 'anthropic' },
      session,
      '',
      'key',
      new AbortController().signal,
    ),
  ).rejects.toThrow('Anthropic didn’t accept your API key\nSave a new key in Settings')
})
