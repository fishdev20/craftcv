import { it, expect } from 'vitest'
import type { Evidence, Repository, Suggestion } from '../src/shared/contracts'
import { Operations } from '../src/main/core/operations'
import {
  createSession,
  emptyStats,
  interleaveByRepository,
  relevantEvidence,
  reviewSuggestion,
} from '../src/main/domain/session'
import { tailoredDocument, tailoredText } from '../src/main/domain/tailored-document'

const evidence = (id: string, repositoryId: string, skills = ['React']): Evidence => ({
  id,
  repositoryId,
  path: `src/${id}.tsx`,
  line: 1,
  snippet: 'import React from "react"',
  skills,
  hash: id,
})
const repo = (id: string): Repository => ({
  id,
  name: `Repo ${id}`,
  path: `/r/${id}`,
  projectId: 'p',
})

it('keeps only evidence for requested skills, bounded per repository, and labelled', () => {
  const scanned = [evidence('a', 'r1'), evidence('b', 'r1', ['Python'])]
  const kept = relevantEvidence(scanned, ['React'], repo('r1'), [], 1)
  expect(kept.map((e) => e.id)).toEqual(['a'])
  expect(kept[0].repositoryName).toBe('Repo r1')
  const many = Array.from({ length: 400 }, (_, i) => evidence(String(i), 'r1'))
  expect(relevantEvidence(many, ['React'], repo('r1'), [], 10)).toHaveLength(60)
})

it('interleaves evidence so the first repository does not crowd out the others', () => {
  const items = [evidence('a1', 'a'), evidence('a2', 'a'), evidence('b1', 'b')]
  expect(interleaveByRepository(items, [repo('a'), repo('b')]).map((e) => e.id)).toEqual([
    'a1',
    'b1',
    'a2',
  ])
})

it('refuses to approve an edited bullet whose claims its evidence does not support', () => {
  const session = createSession({
    job: 'React developer',
    requirements: ['React'],
    evidence: [evidence('e1', 'r1')],
    stats: emptyStats(),
    resumeId: null,
  })
  const previous: Suggestion = {
    id: 's1',
    sessionId: session.id,
    text: 'Worked with React.',
    requirement: 'React',
    evidenceIds: ['e1'],
    warnings: [],
    status: 'pending',
  }
  expect(() =>
    reviewSuggestion(
      previous,
      { id: 's1', text: 'Reduced latency by 50%', status: 'approved' },
      session,
    ),
  ).toThrow('Resolve unsupported claims')
  const approved = reviewSuggestion(
    previous,
    { id: 's1', text: 'Worked with React in project source code.', status: 'approved' },
    session,
  )
  expect(approved).toMatchObject({ status: 'approved', warnings: [] })
})

it('appends approved bullets to the base CV under their own heading', () => {
  const bullet = { text: 'Built React views.' } as Suggestion
  const { name, document } = tailoredDocument(undefined, [bullet])
  expect(name).toBe('Tailored resume')
  expect(JSON.stringify(document)).toContain('Selected project experience')
  expect(tailoredText(undefined, [bullet])).toBe(
    'Resume\n\nSelected project experience\n• Built React views.',
  )
})

it('runs one long operation at a time, and cancels it on request', async () => {
  const operations = new Operations()
  let signal: AbortSignal | undefined
  const first = operations.run(
    (s) =>
      new Promise<void>((resolve) => {
        signal = s
        s.addEventListener('abort', () => resolve())
      }),
  )
  await expect(operations.run(async () => {})).rejects.toThrow('Another operation is running')
  expect(() => operations.assertIdle('busy')).toThrow('busy')
  operations.cancel()
  await first
  expect(signal?.aborted).toBe(true)
  expect(operations.running).toBe(false)
})
