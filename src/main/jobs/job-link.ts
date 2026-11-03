import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
import {
  boardPosting,
  indeedPosting,
  jobSource,
  linkedinPosting,
  microdataPosting,
  pagePosting,
  structuredPosting,
  type JobPosting,
} from '../domain/job-posting'

const MAX_BYTES = 3 * 1024 * 1024
const MAX_REDIRECTS = 5
const TIMEOUT_MS = 20000
// many job sites refuse requests that do not look like a browser
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'

/** Addresses on this computer or a private network, which a pasted link must not reach. */
const privateAddresses = new BlockList()
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 3],
] as const)
  privateAddresses.addSubnet(network, prefix, 'ipv4')
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  // IPv4-mapped addresses (::ffff:a.b.c.d) are checked against the IPv4 rules above
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const)
  privateAddresses.addSubnet(network, prefix, 'ipv6')

const failure = (title: string, help: string) => new Error(`${title}\n${help}`)
const PASTE = 'Open it in your browser and paste the description instead.'
const OPEN = 'Use Open the posting to load it in CraftCV, or paste the description instead.'

const linkedinSignIn = () =>
  failure(
    'LinkedIn needs you to sign in to show this job',
    'Use Open the posting to sign in and load it in CraftCV, or paste its description instead.',
  )

/** Parses what the person pasted; only public https links are accepted. */
export function parseJobLink(link: string): URL {
  let url: URL
  try {
    url = new URL(link.trim())
  } catch {
    throw failure(
      'That isn’t a web link',
      'Paste the full address of the job posting, starting with https://.',
    )
  }
  if (url.protocol !== 'https:')
    throw failure('Only secure links are supported', 'Use the https:// address of the job posting.')
  if (url.username || url.password || url.port)
    throw failure('CraftCV can’t open that link', 'Use the job posting’s plain public address.')
  return url
}

/** Throws unless the link's host resolves only to public addresses. */
export async function assertPublic(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, '')
  let addresses: { address: string; family: number }[]
  try {
    addresses = isIP(host)
      ? [{ address: host, family: isIP(host) }]
      : await lookup(host, { all: true, verbatim: true })
  } catch {
    throw failure(
      `Couldn’t find ${url.hostname}`,
      'Check the link and your internet connection, then try again.',
    )
  }
  if (
    !addresses.length ||
    addresses.some(({ address, family }) =>
      privateAddresses.check(address, family === 6 ? 'ipv6' : 'ipv4'),
    )
  )
    throw failure(
      'CraftCV can’t open that link',
      'Links to this computer or your local network aren’t supported. Use the job posting’s public address.',
    )
}

function statusError(status: number, url: URL): Error {
  if (/(^|\.)linkedin\.com$/.test(url.hostname) && [401, 403, 429, 999].includes(status))
    return linkedinSignIn()
  if (status === 404 || status === 410)
    return failure(
      'The job posting wasn’t found',
      'It may have closed or been removed. Check the link, or paste the description instead.',
    )
  if ([401, 403, 429, 999].includes(status))
    return failure(`${url.hostname} doesn’t let apps read its pages`, OPEN)
  return failure(
    `${url.hostname} couldn’t show the page`,
    `It answered with error ${status}. ${PASTE}`,
  )
}

/** At most MAX_BYTES of the body; job details sit near the top of a page, so the rest can go. */
async function readLimited(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const decoder = new TextDecoder()
  let text = '',
    bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    bytes += value.byteLength
    text += decoder.decode(value, { stream: true })
    if (bytes >= MAX_BYTES) {
      await reader.cancel()
      break
    }
  }
  return text + decoder.decode()
}

/**
 * Fetches a public https address without cookies, following redirects one at a time so
 * that each one is checked too.
 */
async function get(start: URL, accept: string, signal: AbortSignal) {
  let url = start
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublic(url)
    let response: Response
    try {
      response = await fetch(url, {
        redirect: 'manual',
        credentials: 'omit',
        headers: { accept, 'accept-language': 'en', 'user-agent': USER_AGENT },
        signal: AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)]),
      })
    } catch (error) {
      if (signal.aborted) throw error
      throw (error as Error).name === 'TimeoutError'
        ? failure(
            `${url.hostname} took too long to respond`,
            `Try again, or paste the description instead.`,
          )
        : failure(
            `Couldn’t reach ${url.hostname}`,
            'Check the link and your internet connection, then try again.',
          )
    }
    const location = response.headers.get('location')
    if (response.status >= 300 && response.status < 400 && location) {
      await response.body?.cancel()
      url = parseJobLink(new URL(location, url).href)
      continue
    }
    if (!response.ok) {
      await response.body?.cancel()
      throw statusError(response.status, url)
    }
    return { url, body: await readLimited(response) }
  }
  throw failure('That link redirects too many times', PASTE)
}

const isLinkedin = (url: URL) => /(^|\.)linkedin\.com$/.test(url.hostname)
const isIndeed = (url: URL) => /(^|\.)indeed\.com$/.test(url.hostname)

/**
 * The job on a page's HTML: the posting it declares for search engines, else the job site's
 * own layout, else its main text. `fromPage` marks the last, which needs a person to check it.
 */
export function pageJob(html: string, url: URL): { posting: JobPosting; fromPage: boolean } | null {
  const posting =
    structuredPosting(html) ??
    microdataPosting(html) ??
    (isIndeed(url) ? indeedPosting(html) : null) ??
    (isLinkedin(url) ? linkedinPosting(html) : null)
  if (posting) return { posting, fromPage: false }
  const page = pagePosting(html)
  return page && page.description.length >= 200 ? { posting: page, fromPage: true } : null
}

/**
 * The job a link points to: from the job board's API when the link is from one, otherwise
 * from the page itself (see `pageJob`).
 */
export async function readJobLink(
  link: string,
  signal: AbortSignal,
): Promise<{ posting: JobPosting; fromPage: boolean }> {
  const source = jobSource(parseJobLink(link))
  if (source.kind !== 'page') {
    const { body } = await get(new URL(source.api), 'application/json', signal)
    let data: unknown = null
    try {
      data = JSON.parse(body)
    } catch {
      // handled as a reply without the job
    }
    const posting = boardPosting(source, data)
    if (!posting?.description)
      throw failure('No job description found for that link', `The job may have closed. ${PASTE}`)
    return { posting, fromPage: false }
  }
  const { url, body } = await get(new URL(source.page), 'text/html,application/xhtml+xml', signal)
  const linkedin = source.linkedin || isLinkedin(url)
  const job = pageJob(body, url)
  // signed-out visitors may get the public job page, or a sign-in page instead of an error
  if (linkedin && (!job || job.fromPage)) throw linkedinSignIn()
  if (!job)
    throw failure(
      'No job description found on that page',
      `The page may need you to sign in, or it loads the job in a way CraftCV can’t read. ${OPEN}`,
    )
  return job
}
