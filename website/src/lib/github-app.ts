import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { NAME, OWNER } from './site'

// Starring the repository from the site, through a GitHub App whose only permission is
// Starring (Account permissions, read and write). See README.md for the setup.

export const STATE_COOKIE = 'craftcv_gh_state'
// what the callback page reports back: a new star, a star the visitor already had, a
// sign-in the visitor cancelled, or anything that went wrong
export type StarResult = 'starred' | 'already' | 'denied' | 'failed'

const API = 'https://api.github.com'
const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'craftcv-website',
}

export function githubApp() {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  return clientId && clientSecret ? { clientId, clientSecret } : null
}
type App = NonNullable<ReturnType<typeof githubApp>>

export const callbackUrl = (request: NextRequest) =>
  new URL('/api/github/callback/', request.nextUrl.origin).toString()

export function sameState(a: string, b: string) {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

/** Trades the sign-in code for the visitor's token. */
export async function exchangeCode(app: App, code: string, redirectUri: string) {
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: app.clientId,
      client_secret: app.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  })
  const body = (await response.json()) as { access_token?: string }
  if (!response.ok || !body.access_token) throw new Error('GitHub refused the sign-in code')
  return body.access_token
}

/** Stars the repository as the visitor; says whether they had starred it already. */
export async function starRepository(token: string): Promise<'starred' | 'already'> {
  const auth = { ...headers, Authorization: `Bearer ${token}` }
  const url = `${API}/user/starred/${OWNER}/${NAME}`
  const check = await fetch(url, { headers: auth })
  if (check.status === 204) return 'already'
  const star = await fetch(url, { method: 'PUT', headers: auth })
  if (star.status !== 204) throw new Error(`GitHub answered ${star.status}`)
  return 'starred'
}

/** Revokes the token once it has done its one job; the site never keeps it. */
export async function revokeToken(app: App, token: string) {
  const basic = Buffer.from(`${app.clientId}:${app.clientSecret}`).toString('base64')
  await fetch(`${API}/applications/${app.clientId}/token`, {
    method: 'DELETE',
    headers: { ...headers, Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token }),
  })
}
