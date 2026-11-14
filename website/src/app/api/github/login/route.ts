import { randomBytes } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { STATE_COOKIE, callbackUrl, githubApp } from '@/lib/github-app'
import { REPO } from '@/lib/site'

export const dynamic = 'force-dynamic'

/**
 * Sends the visitor to GitHub to approve starring the repository. `?mode=page` is the
 * fallback when the browser blocked the popup: the callback then returns to the home page.
 */
export function GET(request: NextRequest) {
  const app = githubApp()
  // not set up yet: the button behaves as a plain link to the repository
  if (!app) return NextResponse.redirect(REPO)
  const state = randomBytes(24).toString('base64url')
  const mode = request.nextUrl.searchParams.get('mode') === 'page' ? 'page' : 'popup'
  const authorize = new URL('https://github.com/login/oauth/authorize')
  authorize.searchParams.set('client_id', app.clientId)
  authorize.searchParams.set('redirect_uri', callbackUrl(request))
  authorize.searchParams.set('state', state)
  const response = NextResponse.redirect(authorize)
  response.cookies.set(STATE_COOKIE, `${state}.${mode}`, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/api/github/',
    maxAge: 600,
  })
  return response
}
