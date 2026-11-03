import { BrowserWindow, session, type Session } from 'electron'
import { jobSource, type JobPosting } from '../domain/job-posting'
import { assertPublic, pageJob, parseJobLink } from './job-link'

// without the `persist:` prefix the session lives in memory, so sign-ins end with the app
const PARTITION = 'craftcv-job-page'
const MAX_CHARS = 3 * 1024 * 1024
const READ_TIMEOUT_MS = 10000
// a world of its own: the page's scripts share the DOM but cannot change what this reads
const READING_WORLD = 1001

let window: BrowserWindow | null = null
let configured: Session | null = null

const failure = (title: string, help: string) => new Error(`${title}\n${help}`)
const isHttps = (url: string) => url.startsWith('https://')

/** The posting window's session: no permissions, no downloads, nothing kept on disk. */
function pageSession(): Session {
  if (configured) return configured
  const pages = session.fromPartition(PARTITION)
  pages.setPermissionRequestHandler((_wc, _permission, callback) => callback(false))
  pages.setPermissionCheckHandler(() => false)
  pages.on('will-download', (event) => event.preventDefault())
  configured = pages
  return pages
}

function create(parent: BrowserWindow): BrowserWindow {
  const [x, y] = parent.getPosition()
  const opened = new BrowserWindow({
    x: x + 60,
    y: y + 40,
    width: 1000,
    height: 820,
    title: 'Job posting',
    autoHideMenuBar: true,
    webPreferences: {
      session: pageSession(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  })
  const contents = opened.webContents
  // links that open a new window stay in this one, and only secure pages load
  contents.setWindowOpenHandler(({ url }) => {
    if (isHttps(url)) void contents.loadURL(url)
    return { action: 'deny' }
  })
  contents.on('will-navigate', (event) => {
    if (!isHttps(event.url)) event.preventDefault()
  })
  contents.on('will-redirect', (event) => {
    if (!isHttps(event.url)) event.preventDefault()
  })
  contents.on('will-attach-webview', (event) => event.preventDefault())
  opened.on('page-title-updated', (event, title) => {
    event.preventDefault()
    opened.setTitle(`${title} · press Use this page in CraftCV`)
  })
  const closeWithApp = () => close()
  parent.once('closed', closeWithApp)
  opened.on('closed', () => {
    if (!parent.isDestroyed()) parent.off('closed', closeWithApp)
    if (window === opened) window = null
  })
  return opened
}

/**
 * Opens a job link in a separate, locked-down window, for sites that refuse CraftCV's own
 * requests: the person loads the page, signing in if the site asks, then uses it.
 */
export async function openJobPage(link: string, parent: BrowserWindow) {
  const url = parseJobLink(link)
  const source = jobSource(url)
  const page = new URL(source.kind === 'page' ? source.page : url.href)
  await assertPublic(page)
  if (!window || window.isDestroyed()) window = create(parent)
  window.show()
  window.focus()
  // a page that fails to load still leaves the window for the person to retry or navigate
  await window.loadURL(page.href).catch(() => undefined)
}

/** Reads the job from the page showing in the posting window, then closes the window. */
export async function readJobPage(): Promise<{
  posting: JobPosting
  fromPage: boolean
  url: string
}> {
  if (!window || window.isDestroyed())
    throw failure(
      'The posting window was closed',
      'Open the posting again, or paste the description.',
    )
  const contents = window.webContents
  const url = new URL(contents.getURL())
  if (url.protocol !== 'https:')
    throw failure(
      'That page isn’t a secure web page',
      'Open the job posting itself, then try again.',
    )
  const html: unknown = await Promise.race([
    contents.executeJavaScriptInIsolatedWorld(READING_WORLD, [
      { code: 'document.documentElement.outerHTML' },
    ]),
    new Promise((_, reject) =>
      setTimeout(
        () => reject(failure('The page took too long to read', 'Try again.')),
        READ_TIMEOUT_MS,
      ),
    ),
  ])
  if (typeof html !== 'string')
    throw failure('Couldn’t read that page', 'Wait for the job to load, then try again.')
  const job = pageJob(html.slice(0, MAX_CHARS), url)
  if (!job)
    throw failure(
      'No job description found on this page',
      'Open the job’s own page, not a list of results, and wait for it to load. Then try again.',
    )
  close()
  return { ...job, url: url.href }
}

export function close() {
  if (window && !window.isDestroyed()) window.close()
  window = null
}
