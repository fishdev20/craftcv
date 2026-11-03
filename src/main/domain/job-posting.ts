import { z } from 'zod'

/** A job read from a posting's page or its job board's API. */
export type JobPosting = {
  title: string | null
  company: string | null
  location: string | null
  description: string
}

/**
 * Where a link's job can be read from: a job board's public API, which gives clean data,
 * or the page itself. LinkedIn and Indeed job links are reduced to the job's own page.
 */
type JobSource =
  | { kind: 'greenhouse' | 'lever' | 'workday' | 'smartrecruiters' | 'workable'; api: string }
  | { kind: 'ashby'; api: string; id: string }
  | { kind: 'page'; page: string; linkedin: boolean }

const named: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  bull: '•',
  middot: '·',
  trade: '™',
  reg: '®',
  copy: '©',
  euro: '€',
  pound: '£',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] !== '#') return named[code.toLowerCase()] ?? match
    const point = /x/i.test(code[1]) ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match
  })
}

const tidy = (text: string) =>
  text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    // a list item whose text sat in its own paragraph
    .replace(/^•\n+(?=\S)/gm, '• ')
    // items of one list stay together
    .replace(/(?<=^• .*)\n\n(?=• )/gm, '\n')
    .trim()

/** Readable text from a fragment of HTML: paragraphs, headings and list items on their own lines. */
export function htmlToText(html: string): string {
  // descriptions from JSON-LD and board APIs are often escaped once more
  const source = !/<[a-z/!]/i.test(html) && /&lt;\/?[a-z]/i.test(html) ? decodeEntities(html) : html
  const text = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|svg|template|iframe)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(
      /<\/?(p|div|section|article|header|footer|ul|ol|h[1-6]|tr|table|blockquote|pre|dl|dt|dd)\b[^>]*>/gi,
      '\n\n',
    )
    .replace(/<[^>]+>/g, '')
  return tidy(decodeEntities(text))
}

/** The job as the text the job description field takes: a heading line, then the description. */
export function jobText(posting: JobPosting): string {
  const heading = [posting.title, posting.company].filter(Boolean).join(' at ')
  const lines = [
    heading,
    posting.location && `Location: ${posting.location}`,
    posting.description,
  ].filter(Boolean)
  return lines.join('\n\n')
}

const segments = (url: URL) => url.pathname.split('/').filter(Boolean)

/** Where to read the job a link points to. Throws for a LinkedIn link that is not a job. */
export function jobSource(url: URL): JobSource {
  const host = url.hostname.toLowerCase().replace(/^www\./, '')
  const [first, second, third] = segments(url)
  if (
    /^(job-)?boards\.greenhouse\.io$/.test(host) &&
    second === 'jobs' &&
    /^\d+$/.test(third ?? '')
  )
    return {
      kind: 'greenhouse',
      api: `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(first)}/jobs/${third}`,
    }
  if (/^jobs(\.eu)?\.lever\.co$/.test(host) && first && /^[\da-f-]{36}$/i.test(second ?? ''))
    return {
      kind: 'lever',
      api: `https://api${host.includes('.eu.') ? '.eu' : ''}.lever.co/v0/postings/${encodeURIComponent(first)}/${second}`,
    }
  if (host === 'jobs.ashbyhq.com' && first && /^[\da-f-]{36}$/i.test(second ?? ''))
    return {
      kind: 'ashby',
      api: `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(first)}`,
      id: second.toLowerCase(),
    }
  const workday = /^([\w-]+)\.wd\d+\.myworkdayjobs\.com$/.exec(host)
  if (workday) {
    // an optional locale such as en-US comes before the career site's name
    const parts = segments(url)
    const [site, kind, ...path] = /^[a-z]{2}-[A-Z]{2}$/.test(parts[0] ?? '')
      ? parts.slice(1)
      : parts
    if (site && kind === 'job' && path.length)
      return {
        kind: 'workday',
        api: `https://${host}/wday/cxs/${encodeURIComponent(workday[1])}/${encodeURIComponent(site)}/job/${path.map(encodeURIComponent).join('/')}`,
      }
  }
  const smartId = /^(\d+)(?:-|$)/.exec(second ?? '')?.[1]
  if (host === 'jobs.smartrecruiters.com' && first && smartId)
    return {
      kind: 'smartrecruiters',
      api: `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(first)}/postings/${smartId}`,
    }
  if (host === 'apply.workable.com' && first && second === 'j' && /^[\dA-Z]+$/i.test(third ?? ''))
    return {
      kind: 'workable',
      api: `https://apply.workable.com/api/v2/accounts/${encodeURIComponent(first)}/jobs/${third}`,
    }
  if (host === 'indeed.com' || host.endsWith('.indeed.com')) {
    // search results and tracking links carry the job's key as jk or vjk
    const key = url.searchParams.get('jk') ?? url.searchParams.get('vjk')
    if (key && /^[\da-f]{16}$/i.test(key))
      return { kind: 'page', page: `https://${url.hostname}/viewjob?jk=${key}`, linkedin: false }
  }
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
    const id =
      /\/jobs\/view\/(?:[^/]*?-)?(\d+)/.exec(url.pathname)?.[1] ??
      url.searchParams.get('currentJobId')
    if (!id || !/^\d+$/.test(id))
      throw new Error(
        'That LinkedIn link isn’t a job posting\nOpen the job on LinkedIn and copy the link from its page.',
      )
    return { kind: 'page', page: `https://www.linkedin.com/jobs/view/${id}/`, linkedin: true }
  }
  return { kind: 'page', page: url.href, linkedin: false }
}

const greenhouseSchema = z.object({
  title: z.string(),
  content: z.string(),
  company_name: z.string().nullish(),
  location: z.object({ name: z.string().nullish() }).nullish(),
})

const leverSchema = z.object({
  text: z.string(),
  description: z.string().nullish(),
  additional: z.string().nullish(),
  categories: z.object({ location: z.string().nullish() }).nullish(),
  lists: z.array(z.object({ text: z.string(), content: z.string() })).nullish(),
})

const ashbySchema = z.object({
  jobs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      location: z.string().nullish(),
      descriptionHtml: z.string().nullish(),
      descriptionPlain: z.string().nullish(),
    }),
  ),
})

const workdaySchema = z.object({
  jobPostingInfo: z.object({
    title: z.string(),
    jobDescription: z.string(),
    location: z.string().nullish(),
  }),
  hiringOrganization: z.object({ name: z.string().nullish() }).nullish(),
})

const section = z.object({ title: z.string().nullish(), text: z.string().nullish() }).nullish()
const smartRecruitersSchema = z.object({
  name: z.string(),
  company: z.object({ name: z.string().nullish() }).nullish(),
  location: z
    .object({ fullLocation: z.string().nullish(), remote: z.boolean().nullish() })
    .nullish(),
  jobAd: z.object({
    sections: z.object({
      jobDescription: section,
      qualifications: section,
      additionalInformation: section,
    }),
  }),
})

const workableSchema = z.object({
  title: z.string(),
  description: z.string().nullish(),
  requirements: z.string().nullish(),
  benefits: z.string().nullish(),
  remote: z.boolean().nullish(),
  location: z
    .object({
      city: z.string().nullish(),
      region: z.string().nullish(),
      country: z.string().nullish(),
    })
    .nullish(),
})

const remotely = (location: string | null, remote: boolean | null | undefined) =>
  remote ? [location, 'Remote'].filter(Boolean).join(' · ') : location

/** The posting from a job board API's reply, or null when it does not hold the job. */
export function boardPosting(source: JobSource, data: unknown): JobPosting | null {
  if (source.kind === 'greenhouse') {
    const job = greenhouseSchema.safeParse(data)
    if (!job.success) return null
    return {
      title: job.data.title,
      company: job.data.company_name ?? null,
      location: job.data.location?.name ?? null,
      description: htmlToText(job.data.content),
    }
  }
  if (source.kind === 'lever') {
    const job = leverSchema.safeParse(data)
    if (!job.success) return null
    const lists = (job.data.lists ?? []).map(
      (list) => `<h3>${list.text}</h3><ul>${list.content}</ul>`,
    )
    return {
      title: job.data.text,
      company: null,
      location: job.data.categories?.location ?? null,
      description: htmlToText(
        [job.data.description ?? '', ...lists, job.data.additional ?? ''].join(''),
      ),
    }
  }
  if (source.kind === 'ashby') {
    const board = ashbySchema.safeParse(data)
    const job = board.success && board.data.jobs.find((item) => item.id.toLowerCase() === source.id)
    if (!job) return null
    return {
      title: job.title,
      company: null,
      location: job.location ?? null,
      description: job.descriptionHtml
        ? htmlToText(job.descriptionHtml)
        : tidy(job.descriptionPlain ?? ''),
    }
  }
  if (source.kind === 'workday') {
    const job = workdaySchema.safeParse(data)
    if (!job.success) return null
    return {
      title: job.data.jobPostingInfo.title,
      company: job.data.hiringOrganization?.name || null,
      location: job.data.jobPostingInfo.location ?? null,
      description: htmlToText(job.data.jobPostingInfo.jobDescription),
    }
  }
  if (source.kind === 'smartrecruiters') {
    const job = smartRecruitersSchema.safeParse(data)
    if (!job.success) return null
    const { jobDescription, qualifications, additionalInformation } = job.data.jobAd.sections
    const parts = [jobDescription, qualifications, additionalInformation]
      .filter((part) => part?.text)
      .map((part) => `<h3>${part?.title ?? ''}</h3>${part?.text}`)
    return {
      title: job.data.name,
      company: job.data.company?.name ?? null,
      location: remotely(job.data.location?.fullLocation ?? null, job.data.location?.remote),
      description: htmlToText(parts.join('')),
    }
  }
  if (source.kind === 'workable') {
    const job = workableSchema.safeParse(data)
    if (!job.success) return null
    const { city, region, country } = job.data.location ?? {}
    const places = [city, region, country].filter((part): part is string => Boolean(part))
    return {
      title: job.data.title,
      company: null,
      location: remotely(places.length ? [...new Set(places)].join(', ') : null, job.data.remote),
      description: htmlToText(
        [
          job.data.description ?? '',
          job.data.requirements && `<h3>Requirements</h3>${job.data.requirements}`,
          job.data.benefits && `<h3>Benefits</h3>${job.data.benefits}`,
        ]
          .filter(Boolean)
          .join(''),
      ),
    }
  }
  return null
}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? decodeEntities(value.trim()) : null

const isJobPosting = (node: Record<string, unknown>) =>
  [node['@type']].flat().some((type) => type === 'JobPosting')

/** Every JSON-LD object on the page, including those inside arrays and `@graph`. */
function jsonLdNodes(html: string): Record<string, unknown>[] {
  const nodes: Record<string, unknown>[] = []
  const visit = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(visit)
    else if (value && typeof value === 'object') {
      nodes.push(value as Record<string, unknown>)
      visit((value as Record<string, unknown>)['@graph'])
    }
  }
  const scripts = html.matchAll(
    /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi,
  )
  for (const [, body] of scripts) {
    try {
      visit(JSON.parse(body.replace(/^\s*(<!--|<!\[CDATA\[)|(-->|\]\]>)\s*$/g, '')))
    } catch {
      // a malformed block on someone else's page; the others may still hold the job
    }
  }
  return nodes
}

function place(value: unknown): string | null {
  const location = [value].flat()[0] as Record<string, unknown> | undefined
  const address = location?.address
  if (typeof address === 'string') return text(address)
  if (!address || typeof address !== 'object') return text(location?.name)
  const { addressLocality, addressRegion, addressCountry } = address as Record<string, unknown>
  const country =
    addressCountry && typeof addressCountry === 'object'
      ? (addressCountry as Record<string, unknown>).name
      : addressCountry
  const parts = [addressLocality, addressRegion, country].map(text).filter(Boolean)
  return parts.length ? [...new Set(parts)].join(', ') : null
}

/** The schema.org JobPosting a page declares for search engines, if it has one. */
export function structuredPosting(html: string): JobPosting | null {
  const node = jsonLdNodes(html).find(isJobPosting)
  const description = node && text(node.description)
  if (!node || !description) return null
  const organization = node.hiringOrganization
  const remote = [node.jobLocationType].flat().includes('TELECOMMUTE')
  const location = place(node.jobLocation)
  return {
    title: text(node.title),
    company:
      organization && typeof organization === 'object'
        ? text((organization as Record<string, unknown>).name)
        : text(organization),
    location: remote ? [location, 'Remote'].filter(Boolean).join(' · ') : location,
    description: htmlToText(description),
  }
}

/** The first opening tag matching `pattern`, which must match from its `<`, and the HTML inside its element. */
function element(html: string, pattern: RegExp): { tag: string; inner: string } | null {
  const start = html.search(pattern)
  const open = start < 0 ? null : /^<([a-z][\w-]*)\b[^>]*>/i.exec(html.slice(start))
  if (!open) return null
  const from = start + open[0].length
  // <meta> and the like hold their value in `content` and have nothing inside
  if (/\/>$/.test(open[0]) || /^(meta|link|img|input|br|hr)$/i.test(open[1]))
    return { tag: open[0], inner: '' }
  const tags = new RegExp(`<(/?)${open[1]}\\b[^>]*>`, 'gi')
  tags.lastIndex = from
  let depth = 1
  for (let tag = tags.exec(html); tag; tag = tags.exec(html)) {
    depth += tag[1] ? -1 : 1
    if (!depth) return { tag: open[0], inner: html.slice(from, tag.index) }
  }
  return null
}

const withProp = (name: string) =>
  new RegExp(`<[a-z][\\w-]*\\b[^>]*\\bitemprop=["']${name}["']`, 'i')

/** A microdata property's value: its `content` attribute, or the text inside it. */
function prop(html: string, name: string): string | null {
  const found = element(html, withProp(name))
  if (!found) return null
  const content = /\bcontent=["']([^"']*)["']/i.exec(found.tag)?.[1]
  return text(content) ?? (htmlToText(found.inner) || null)
}

/** A JobPosting the page marks up with schema.org microdata rather than JSON-LD. */
export function microdataPosting(html: string): JobPosting | null {
  const scope = element(
    html,
    /<[a-z][\w-]*\b[^>]*\bitemtype=["'][^"']*schema\.org\/JobPosting["']/i,
  )?.inner
  const description = scope && element(scope, withProp('description'))?.inner
  if (!scope || !description) return null
  const organization = element(scope, withProp('hiringOrganization'))?.inner
  const places = ['addressLocality', 'addressRegion', 'addressCountry']
    .map((name) => prop(scope, name))
    .filter((part): part is string => Boolean(part))
  return {
    title: prop(scope, 'title'),
    company: organization ? prop(organization, 'name') : null,
    location: places.length ? [...new Set(places)].join(', ') : null,
    description: htmlToText(description),
  }
}

const byClass = (tag: string, name: string) =>
  new RegExp(`<${tag}\\b[^>]*\\bclass=["'][^"']*\\b${name}\\b`, 'i')

const textIn = (html: string, pattern: RegExp) => {
  const inner = element(html, pattern)?.inner
  return inner ? htmlToText(inner) || null : null
}

/** The job on LinkedIn's public job page, which declares no posting for search engines. */
export function linkedinPosting(html: string): JobPosting | null {
  const description = textIn(html, byClass('div', 'show-more-less-html__markup'))
  if (!description) return null
  return {
    title: textIn(html, byClass('h1', 'top-card-layout__title')),
    company: textIn(html, byClass('a', 'topcard__org-name-link')),
    location: textIn(html, byClass('span', 'topcard__flavor--bullet')),
    description,
  }
}

const byAttribute = (attribute: string) => new RegExp(`<[a-z][\\w-]*\\b[^>]*\\b${attribute}`, 'i')

/** The job on an Indeed job page, when Indeed shows the page to CraftCV at all. */
export function indeedPosting(html: string): JobPosting | null {
  const description = textIn(html, byAttribute('id=["\']jobDescriptionText["\']'))
  if (!description) return null
  return {
    title: textIn(html, byAttribute('class=["\'][^"\']*\\bjobsearch-JobInfoHeader-title\\b')),
    company: textIn(html, byAttribute('data-company-name=["\']true["\']')),
    location: textIn(
      html,
      byAttribute('data-testid=["\'](?:inlineHeader-companyLocation|job-location)["\']'),
    ),
    description,
  }
}

/** The part of the page between the first opening and the last closing `tag`, if any. */
function inside(html: string, tag: string): string | null {
  const start = html.search(new RegExp(`<${tag}\\b`, 'i')),
    end = html.toLowerCase().lastIndexOf(`</${tag}`)
  return start >= 0 && end > start ? html.slice(start, end) : null
}

/** The page's main text, for pages that declare no posting; the person checks it before use. */
export function pagePosting(html: string): JobPosting | null {
  const title =
    /<meta\b[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] ??
    /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]
  const main = inside(html, 'main') ?? inside(html, 'article') ?? inside(html, 'body') ?? html
  const description = htmlToText(
    main.replace(/<(nav|header|footer|aside|form|button|select)\b[\s\S]*?<\/\1\s*>/gi, ''),
  )
  return description ? { title: text(title), company: null, location: null, description } : null
}
