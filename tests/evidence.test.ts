import { describe, it, expect } from 'vitest'
import {
  extractEvidence,
  localSuggestions,
  requirements,
  validateClaim,
} from '../src/main/domain/evidence'
import {
  analyzeProjectSchema,
  generateSchema,
  requestSchema,
  reviewSchema,
} from '../src/shared/contracts'
describe('deterministic evidence pipeline', () => {
  it('extracts explicit requirements and source lines', () => {
    expect(requirements('Looking for React, TypeScript and PostgreSQL experience.')).toEqual([
      'TypeScript',
      'React',
      'PostgreSQL',
    ])
    const evidence = extractEvidence(
      'import React from "react"\nconst value: string = "hello"',
      'src/app.tsx',
      'repo',
    )
    const drafts = localSuggestions('session', ['React', 'Python'], evidence)
    expect(drafts).toHaveLength(1)
    expect(drafts[0].evidenceIds[0]).toBe(evidence.find((e) => e.skills.includes('React'))?.id)
  })
  it('flags invented impact and missing citations', () => {
    const evidence = extractEvidence('import React from "react"', 'app.tsx', 'repo')
    expect(validateClaim('Reduced latency by 50%', [], evidence)).toHaveLength(2)
    expect(validateClaim('Built Python services', [evidence[0].id], evidence)).toContain(
      'Python is not supported by the cited evidence.',
    )
    expect(validateClaim('Worked with React', [evidence[0].id], evidence)).toEqual([])
  })
  it('rejects path-based IPC, oversized jobs, absent consent and invalid reviews', () => {
    expect(
      requestSchema.safeParse({ projectIds: ['/etc'], job: 'x'.repeat(50), resumeId: null })
        .success,
    ).toBe(false)
    expect(
      generateSchema.safeParse({
        sessionId: crypto.randomUUID(),
        provider: 'openai',
        model: 'gpt-4o-mini',
        consent: false,
        tokenBudget: null,
      }).success,
    ).toBe(false)
    expect(
      reviewSchema.safeParse({
        id: crypto.randomUUID(),
        text: '',
        status: 'approved',
      }).success,
    ).toBe(false)
  })
  it('accepts provider model paths and older requests without a token budget', () => {
    expect(
      analyzeProjectSchema.parse({
        projectId: crypto.randomUUID(),
        provider: 'chatgpt',
        model: 'openai/gpt-6.1-sol',
        consent: true,
      }),
    ).toMatchObject({ tokenBudget: null })
  })
})
