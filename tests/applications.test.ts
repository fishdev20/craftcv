import { afterEach, expect, it, vi } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { analyzeJobWithAI, draftFrom, namedInJob } from '../src/main/ai/job-analysis'
import { parsePartialJson } from '../src/main/ai/partial-json'
import { Operations } from '../src/main/core/operations'
import { guessJobDetails } from '../src/main/domain/job-analysis'
import { createApplicationService } from '../src/main/services/applications'
import type { ServiceDeps } from '../src/main/services/deps'
import { Store } from '../src/main/storage/store'
import type { JobDetails } from '../src/shared/contracts'

const directories: string[] = []
const stores: Store[] = []
afterEach(async () => {
  vi.unstubAllGlobals()
  stores.splice(0).forEach((store) => store.close())
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

const posting = `Senior Frontend Engineer
Acme Robotics is hiring a frontend engineer for its fleet dashboard.
Location: Helsinki, Finland (Hybrid)

What you'll do:
- Build accessible React interfaces for operators in the field
- Work with designers and backend engineers on new features

Requirements:
- 5+ years with TypeScript and React
- Experience testing with Playwright
- Kubernetes experience is a plus

Nice to have:
- GraphQL
- Docker
`

it('guesses the role, company and location from the job text', () => {
  expect(guessJobDetails(posting)).toEqual({
    role: 'Senior Frontend Engineer',
    company: 'Acme Robotics',
    location: 'Helsinki, Finland (Hybrid)',
  })
  expect(guessJobDetails('Backend Developer at Wolt\nRemote within the EU')).toEqual({
    role: 'Backend Developer',
    company: 'Wolt',
    location: 'Remote',
  })
  // "About you" is a heading, not a company
  expect(guessJobDetails('About you\nYou enjoy shipping.').company).toBe('')
})

it('keeps only AI terms the job names', () => {
  expect(namedInJob(['React', 'Rust', ' react '], 'We use React daily')).toEqual(['React', 'react'])
})

it('asks a provider for the job and drops terms it invented', async () => {
  const reply = {
    role: 'Senior Frontend Engineer',
    company: 'Acme Robotics',
    location: 'Helsinki',
    mustHave: ['TypeScript', 'Rust'],
    niceToHave: ['GraphQL'],
    keywords: ['fleet dashboard', 'blockchain'],
    responsibilities: ['Build React interfaces'],
  }
  const fetcher = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        output: [{ content: [{ type: 'output_text', text: JSON.stringify(reply) }] }],
        usage: { input_tokens: 10, output_tokens: 5 },
      }),
    ),
  )
  vi.stubGlobal('fetch', fetcher)
  const job: JobDetails = {
    role: '',
    company: '',
    location: '',
    url: null,
    description: posting,
    source: 'manual',
  }
  const { result, usage } = await analyzeJobWithAI(
    {
      id: '00000000-0000-4000-8000-000000000000',
      provider: 'openai',
      model: 'gpt-4o-mini',
      consent: true,
      tokenBudget: null,
    },
    job,
    'test-key',
    new AbortController().signal,
  )
  expect(result.mustHave).toEqual(['TypeScript'])
  expect(result.keywords).toEqual(['fleet dashboard'])
  expect(usage).toEqual({ input: 10, output: 5 })
  expect(JSON.parse(fetcher.mock.calls[0][1].body).text.format.name).toBe('job_analysis')
})

it('creates an application with the job read locally, and tracks its status', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'craftcv-applications-'))
  directories.push(directory)
  const store = new Store(join(directory, 'craftcv.sqlite'))
  stores.push(store)
  const applications = createApplicationService({
    store,
    operations: new Operations(),
    progress: () => {},
  } as unknown as ServiceDeps)
  const created = applications.create({
    role: '',
    company: '',
    location: '',
    url: null,
    description: posting,
    source: 'manual',
  })
  // the requirements wait until the person asks AI to analyse the job
  expect(created).toMatchObject({
    job: { role: 'Senior Frontend Engineer', company: 'Acme Robotics' },
    status: 'preparing',
    step: 'analysis',
    analysis: null,
  })
  expect(store.applications.list()).toMatchObject([
    { id: created.id, role: 'Senior Frontend Engineer', company: 'Acme Robotics', hasLink: false },
  ])

  // edited requirements are kept; a new description drops the analysis of the old one
  store.applications.save({
    ...created,
    analysis: {
      mustHave: ['TypeScript'],
      niceToHave: [],
      keywords: ['TypeScript'],
      responsibilities: [],
      source: 'ai',
      provider: 'openai',
      model: 'gpt-4o-mini',
      analyzedAt: created.createdAt,
      usage: null,
    },
  })
  const edited = applications.update({
    id: created.id,
    requirements: { mustHave: ['React'], niceToHave: [], keywords: ['React'] },
    step: 'cv',
  })
  expect(edited.analysis?.mustHave).toEqual(['React'])
  const described = applications.update({
    id: created.id,
    job: { ...edited.job, description: 'We need a Python developer with Django experience.' },
  })
  expect(described.analysis).toBeNull()
  expect(described.job.role).toBe('Senior Frontend Engineer')

  const applied = applications.setStatus(created.id, 'applied')
  expect(applied.appliedAt).not.toBeNull()
  expect(applied.history.map((entry) => entry.status)).toEqual(['preparing', 'applied'])
  expect(applications.setStatus(created.id, 'applied')).toEqual(applied)
  const interviewing = applications.setStatus(created.id, 'interviewing')
  expect(interviewing.appliedAt).toBe(applied.appliedAt)

  expect(() => applications.update({ id: created.id, resumeId: crypto.randomUUID() })).toThrow(
    /CV not found/,
  )
  await expect(applications.link(created.id)).rejects.toThrow(/no job link/)
  applications.remove(created.id)
  expect(store.applications.list()).toEqual([])
})

it('reads an unfinished JSON reply as far as it goes', () => {
  expect(parsePartialJson('{"role":"Sen')).toEqual({ role: 'Sen' })
  expect(parsePartialJson('{"role":"Senior","comp')).toEqual({ role: 'Senior' })
  expect(parsePartialJson('{"role":"Senior","company":')).toEqual({ role: 'Senior' })
  expect(parsePartialJson('{"mustHave":["Type')).toEqual({ mustHave: ['Type'] })
  expect(parsePartialJson('{"mustHave":["TypeScript",')).toEqual({ mustHave: ['TypeScript'] })
  expect(parsePartialJson('')).toBeUndefined()
})

it('shows only finished terms the job names while the reply streams', () => {
  // "Type" is still being written; "Rust" is finished but the job never names it
  expect(
    draftFrom('{"role":"Senior Frontend Engineer","mustHave":["React","Rust","Type', posting),
  ).toEqual({
    role: 'Senior Frontend Engineer',
    company: undefined,
    location: undefined,
    mustHave: ['React'],
    niceToHave: undefined,
    keywords: undefined,
    responsibilities: undefined,
  })
})
