import { afterEach, expect, it, vi } from 'vitest'
import {
  boardPosting,
  htmlToText,
  indeedPosting,
  jobSource,
  jobText,
  linkedinPosting,
  microdataPosting,
  pagePosting,
  structuredPosting,
} from '../src/main/domain/job-posting'
import { pageJob, readJobLink } from '../src/main/jobs/job-link'

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async (host: string) =>
    host === 'intranet.example'
      ? [{ address: '192.168.1.4', family: 4 }]
      : [{ address: '93.184.215.14', family: 4 }],
  ),
}))
afterEach(() => vi.unstubAllGlobals())

const signal = new AbortController().signal
const reply = (body: string, init: ResponseInit = {}) => new Response(body, init)

it('turns posting HTML into readable lines', () => {
  expect(
    htmlToText(
      '&lt;h2&gt;About&lt;/h2&gt;&lt;p&gt;We build &amp;amp; ship.&lt;/p&gt;&lt;ul&gt;&lt;li&gt;&lt;p&gt;TypeScript&lt;/p&gt;&lt;/li&gt;&lt;li&gt;React&lt;/li&gt;&lt;/ul&gt;',
    ),
  ).toBe('About\n\nWe build & ship.\n\n• TypeScript\n• React')
  expect(htmlToText('<p>Tom&#39;s team&nbsp;<br>Remote</p><script>x()</script>')).toBe(
    "Tom's team\nRemote",
  )
})

it('recognises job board and LinkedIn links', () => {
  expect(jobSource(new URL('https://job-boards.greenhouse.io/acme/jobs/123?gh_src=x'))).toEqual({
    kind: 'greenhouse',
    api: 'https://boards-api.greenhouse.io/v1/boards/acme/jobs/123',
  })
  const id = '0a1b2c3d-1111-2222-3333-444455556666'
  expect(jobSource(new URL(`https://jobs.eu.lever.co/acme/${id}/apply`))).toMatchObject({
    kind: 'lever',
    api: `https://api.eu.lever.co/v0/postings/acme/${id}`,
  })
  expect(jobSource(new URL(`https://jobs.ashbyhq.com/acme/${id}`))).toMatchObject({
    kind: 'ashby',
    id,
  })
  expect(
    jobSource(new URL('https://www.linkedin.com/jobs/view/senior-engineer-at-acme-4012345678/')),
  ).toEqual({
    kind: 'page',
    page: 'https://www.linkedin.com/jobs/view/4012345678/',
    linkedin: true,
  })
  expect(
    jobSource(new URL('https://www.linkedin.com/jobs/collections/recommended/?currentJobId=42')),
  ).toMatchObject({ page: 'https://www.linkedin.com/jobs/view/42/' })
  expect(() => jobSource(new URL('https://www.linkedin.com/in/someone'))).toThrow(
    /isn’t a job posting/,
  )
})

it('reads a JobPosting from JSON-LD, including inside @graph', () => {
  const html = `<script type="application/ld+json">{"@graph":[{"@type":"WebPage"},{"@type":"JobPosting",
    "title":"Platform Engineer","description":"&lt;p&gt;Run Kubernetes.&lt;/p&gt;",
    "hiringOrganization":{"name":"Acme"},"jobLocationType":"TELECOMMUTE",
    "jobLocation":{"address":{"addressLocality":"Helsinki","addressCountry":{"name":"Finland"}}}}]}</script>`
  const posting = structuredPosting(html)
  expect(posting).toEqual({
    title: 'Platform Engineer',
    company: 'Acme',
    location: 'Helsinki, Finland · Remote',
    description: 'Run Kubernetes.',
  })
  expect(jobText(posting!)).toBe(
    'Platform Engineer at Acme\n\nLocation: Helsinki, Finland · Remote\n\nRun Kubernetes.',
  )
  expect(structuredPosting('<script type="application/ld+json">{broken</script>')).toBeNull()
})

it('reads job board API replies', () => {
  const lever = boardPosting(
    { kind: 'lever', api: '' },
    {
      text: 'Backend Developer',
      description: '<div>Join us.</div>',
      categories: { location: 'Oulu' },
      lists: [{ text: 'Requirements', content: '<li>Go</li><li>Postgres</li>' }],
    },
  )
  expect(lever?.description).toBe('Join us.\n\nRequirements\n\n• Go\n• Postgres')
  expect(
    boardPosting({ kind: 'ashby', api: '', id: 'b' }, { jobs: [{ id: 'a', title: 'Other' }] }),
  ).toBeNull()
})

it('falls back to the main text of a page, without its navigation', () => {
  const posting = pagePosting(
    '<title>Data Engineer</title><body><nav>Home</nav><main><h1>Data Engineer</h1><p>Build pipelines.</p></main><footer>©</footer></body>',
  )
  expect(posting).toMatchObject({
    title: 'Data Engineer',
    description: 'Data Engineer\n\nBuild pipelines.',
  })
})

it('reads a Greenhouse job from its API', async () => {
  const fetch = vi.fn<(url: URL) => Promise<Response>>(async () =>
    reply(
      JSON.stringify({
        title: 'SRE',
        content: '&lt;p&gt;On call.&lt;/p&gt;',
        location: { name: 'Espoo' },
      }),
    ),
  )
  vi.stubGlobal('fetch', fetch)
  const job = await readJobLink('https://boards.greenhouse.io/acme/jobs/7', signal)
  expect(fetch.mock.calls[0]?.[0].toString()).toBe(
    'https://boards-api.greenhouse.io/v1/boards/acme/jobs/7',
  )
  expect(job).toEqual({
    posting: { title: 'SRE', company: null, location: 'Espoo', description: 'On call.' },
    fromPage: false,
  })
})

it('explains LinkedIn’s sign-in wall', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: URL) =>
      url.pathname.startsWith('/jobs/view')
        ? reply('', { status: 302, headers: { location: '/authwall?trk=x' } })
        : reply('<html><body><main>Sign in to view this job and many more.</main></body></html>'),
    ),
  )
  await expect(
    readJobLink('https://www.linkedin.com/jobs/view/4012345678', signal),
  ).rejects.toThrow(/^LinkedIn needs you to sign in/)
})

it('refuses links that are not public https pages', async () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  await expect(readJobLink('http://example.com/job', signal)).rejects.toThrow(/secure links/)
  await expect(readJobLink('https://127.0.0.1/job', signal)).rejects.toThrow(/local network/)
  await expect(readJobLink('https://intranet.example/job', signal)).rejects.toThrow(/local network/)
  await expect(readJobLink('job at acme', signal)).rejects.toThrow(/isn’t a web link/)
  expect(fetch).not.toHaveBeenCalled()
})

it('checks where a redirect leads before following it', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      reply('', { status: 301, headers: { location: 'https://intranet.example/' } }),
    ),
  )
  await expect(readJobLink('https://example.com/job', signal)).rejects.toThrow(/local network/)
})

it('reads a JobPosting marked up with microdata', () => {
  const html = `<main itemscope itemtype="http://schema.org/JobPosting">
    <h1 itemprop="title">Ops Manager</h1>
    <meta itemprop="addressLocality" content="Warsaw"><meta itemprop="addressCountry" content="Poland">
    <div itemprop="hiringOrganization" itemscope><meta itemprop="name" content="Acme"></div>
    <div itemprop="description"><div><h2>Duties</h2></div><div><ul><li>Plan</li></ul></div></div>
    <div>Apply now</div></main>`
  expect(microdataPosting(html)).toEqual({
    title: 'Ops Manager',
    company: 'Acme',
    location: 'Warsaw, Poland',
    description: 'Duties\n\n• Plan',
  })
})

it('reads LinkedIn’s public job page', () => {
  const html = `<h1 class="top-card-layout__title topcard__title">Backend Engineer</h1>
    <a class="topcard__org-name-link" href="#">  Wolt </a>
    <span class="topcard__flavor topcard__flavor--bullet"> Helsinki, Finland </span>
    <div class="show-more-less-html__markup relative"><strong>About us<br><br></strong>We ship.<div>Go</div></div>
    <button>Show more</button>`
  expect(linkedinPosting(html)).toEqual({
    title: 'Backend Engineer',
    company: 'Wolt',
    location: 'Helsinki, Finland',
    description: 'About us\n\nWe ship.\n\nGo',
  })
  expect(linkedinPosting('<form class="authwall">Sign in</form>')).toBeNull()
})

it('recognises Workday, SmartRecruiters, Workable and Indeed links', () => {
  expect(
    jobSource(
      new URL(
        'https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/Vietnam-Hanoi/Director_JR2021061?source=x',
      ),
    ),
  ).toEqual({
    kind: 'workday',
    api: 'https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/job/Vietnam-Hanoi/Director_JR2021061',
  })
  expect(
    jobSource(new URL('https://jobs.smartrecruiters.com/Acme/744000158320111-senior-engineer')),
  ).toEqual({
    kind: 'smartrecruiters',
    api: 'https://api.smartrecruiters.com/v1/companies/Acme/postings/744000158320111',
  })
  expect(jobSource(new URL('https://apply.workable.com/acme/j/94F9E30E22/'))).toEqual({
    kind: 'workable',
    api: 'https://apply.workable.com/api/v2/accounts/acme/jobs/94F9E30E22',
  })
  // search results and tracking links lead to the job's own page
  for (const link of [
    'https://fi.indeed.com/jobs?q=react&vjk=0123456789abcdef',
    'https://fi.indeed.com/rc/clk?jk=0123456789abcdef&from=serp',
  ])
    expect(jobSource(new URL(link))).toEqual({
      kind: 'page',
      page: 'https://fi.indeed.com/viewjob?jk=0123456789abcdef',
      linkedin: false,
    })
  expect(jobSource(new URL('https://www.indeed.com/companies'))).toMatchObject({
    page: 'https://www.indeed.com/companies',
  })
})

it('reads Workday, SmartRecruiters and Workable replies', () => {
  expect(
    boardPosting(
      { kind: 'workday', api: '' },
      {
        jobPostingInfo: {
          title: 'Director, Engineering',
          jobDescription: '<p>Lead teams.</p><ul><li>C++</li></ul>',
          location: 'Vietnam, Hanoi',
        },
        hiringOrganization: { name: 'NVIDIA', url: '' },
      },
    ),
  ).toEqual({
    title: 'Director, Engineering',
    company: 'NVIDIA',
    location: 'Vietnam, Hanoi',
    description: 'Lead teams.\n\n• C++',
  })
  const section = (title: string, text: string) => ({ title, text })
  expect(
    boardPosting(
      { kind: 'smartrecruiters', api: '' },
      {
        name: 'Engineering Manager',
        company: { name: 'SmartRecruiters Inc' },
        location: { fullLocation: 'Poland', remote: true },
        jobAd: {
          sections: {
            companyDescription: section('Company Description', '<p>About us</p>'),
            jobDescription: section('Job Description', '<p>Run the team.</p>'),
            qualifications: section('Qualifications', '<ul><li>Kotlin</li></ul>'),
          },
        },
      },
    ),
  ).toEqual({
    title: 'Engineering Manager',
    company: 'SmartRecruiters Inc',
    location: 'Poland · Remote',
    description: 'Job Description\n\nRun the team.\n\nQualifications\n\n• Kotlin',
  })
  expect(
    boardPosting(
      { kind: 'workable', api: '' },
      {
        title: 'Renewals Coordinator',
        remote: false,
        location: { city: 'Athens', region: null, country: 'Greece' },
        description: '<p>Keep customers.</p>',
        requirements: '<ul><li>Salesforce</li></ul>',
      },
    ),
  ).toEqual({
    title: 'Renewals Coordinator',
    company: null,
    location: 'Athens, Greece',
    description: 'Keep customers.\n\nRequirements\n\n• Salesforce',
  })
})

it('reads an Indeed job page, and only on Indeed', () => {
  const html = `<h1 class="jobsearch-JobInfoHeader-title css-1"><span>Frontend Developer</span></h1>
    <div data-company-name="true"><a href="#">Acme Oy</a></div>
    <div data-testid="inlineHeader-companyLocation"><div>Helsinki</div></div>
    <div id="jobDescriptionText" class="jobsearch-jobDescriptionText"><p>Build React apps.</p><ul><li>TypeScript</li></ul></div>`
  expect(indeedPosting(html)).toEqual({
    title: 'Frontend Developer',
    company: 'Acme Oy',
    location: 'Helsinki',
    description: 'Build React apps.\n\n• TypeScript',
  })
  expect(pageJob(html, new URL('https://fi.indeed.com/viewjob?jk=0123456789abcdef'))).toMatchObject(
    { fromPage: false, posting: { company: 'Acme Oy' } },
  )
  // elsewhere the same markup is only page text, and too short to be a job
  expect(pageJob(html, new URL('https://example.com/job'))).toBeNull()
})

it('offers to open a posting whose site blocks CraftCV', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => reply('', { status: 401 })),
  )
  await expect(
    readJobLink('https://www.indeed.com/viewjob?jk=0123456789abcdef', signal),
  ).rejects.toThrow(/^www\.indeed\.com doesn’t let apps read its pages\nUse Open the posting/)
})
