import { NextResponse, type NextRequest } from 'next/server'
import {
  STATE_COOKIE,
  callbackUrl,
  exchangeCode,
  githubApp,
  revokeToken,
  sameState,
  starRepository,
  type StarResult,
} from '@/lib/github-app'

export const dynamic = 'force-dynamic'

/** Where GitHub returns the visitor: star the repository, then tell the page that asked. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const [state = '', mode = 'popup'] = (request.cookies.get(STATE_COOKIE)?.value ?? '').split('.')
  const code = params.get('code')
  const app = githubApp()
  let result: StarResult = 'failed'
  if (params.get('error')) result = 'denied'
  else if (app && code && state && sameState(state, params.get('state') ?? '')) {
    try {
      const token = await exchangeCode(app, code, callbackUrl(request))
      try {
        result = await starRepository(token)
      } finally {
        await revokeToken(app, token).catch(() => {})
      }
    } catch {
      result = 'failed'
    }
  }
  const response =
    mode === 'page'
      ? NextResponse.redirect(new URL(`/?star=${result}`, request.nextUrl.origin))
      : new NextResponse(page(result), {
          headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        })
  response.cookies.set(STATE_COOKIE, '', { path: '/api/github/', maxAge: 0 })
  return response
}

const messages: Record<StarResult, string> = {
  starred: 'Thanks for the star.',
  already: 'You had already starred CraftCV.',
  denied: 'No star was added.',
  failed: 'The star didn’t go through.',
}

/** The popup's last page: hands the result to the site's tab and closes itself. */
function page(result: StarResult) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>CraftCV</title>
<style>body{margin:0;display:grid;place-items:center;height:100vh;font:16px system-ui,sans-serif;color:#0b1b3f}</style></head>
<body><p>${messages[result]}</p>
<script>
  var result = ${JSON.stringify(result)};
  if (window.opener) {
    window.opener.postMessage({ type: 'craftcv:star', result: result }, window.location.origin);
    window.close();
  } else {
    window.location.replace('/?star=' + result);
  }
</script></body></html>`
}
