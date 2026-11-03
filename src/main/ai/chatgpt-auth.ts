import { safeStorage, shell } from 'electron'
import { createServer } from 'node:http'
import {
  createHash,
  createPublicKey,
  randomBytes,
  randomUUID,
  verify as verifySignature,
} from 'node:crypto'
import { chmod, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

const issuer = 'https://auth.openai.com'
const resource = 'https://api.openai.com/v1'
const requiredScopes = ['offline_access', 'resource.invoke', 'chatgpt.tokens.use.direct']
const tokenSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  id_token: z.string().min(1).optional(),
  token_type: z.string(),
  expires_in: z.number().positive(),
  scope: z.string(),
})
const identitySchema = z.object({
  iss: z.literal(issuer),
  sub: z.string().min(1),
  aud: z.union([z.string(), z.array(z.string())]),
  exp: z.number(),
  nonce: z.string().optional(),
  email: z.string().email().optional(),
  name: z.string().optional(),
})
const configurationSchema = z.object({
  jwks_uri: z.string().url(),
  revocation_endpoint: z.string().url(),
})

type Model = { slug: string; displayName: string }
type Record = {
  version: 1
  hostId: string
  clientId?: string
  subject?: string
  email?: string
  name?: string
  idToken?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  scopes: string[]
  models: Model[]
}

function encode(value: Buffer) {
  return value.toString('base64url')
}

function encryptionAvailable() {
  return (
    safeStorage.isEncryptionAvailable() &&
    (process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text')
  )
}

async function configuration() {
  const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('Could not load OpenAI sign-in configuration.')
  return configurationSchema.parse(await response.json())
}

async function verifyIdToken(token: string, clientId: string, nonce: string) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('OpenAI returned an invalid identity token.')
  const header = z
    .object({ kid: z.string(), alg: z.enum(['RS256', 'ES256']) })
    .parse(JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')))
  const metadata = await configuration()
  const response = await fetch(metadata.jwks_uri, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Could not verify the OpenAI identity token.')
  const keys = z
    .object({ keys: z.array(z.record(z.string(), z.unknown())) })
    .parse(await response.json())
  const jwk = keys.keys.find((key) => key.kid === header.kid)
  if (!jwk) throw new Error('OpenAI identity signing key was not found.')
  const key = createPublicKey({ key: jwk as JsonWebKey, format: 'jwk' })
  const valid = verifySignature(
    'sha256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    header.alg === 'ES256' ? { key, dsaEncoding: 'ieee-p1363' } : key,
    Buffer.from(parts[2], 'base64url'),
  )
  if (!valid) throw new Error('OpenAI identity token signature was invalid.')
  const identity = identitySchema.parse(
    JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')),
  )
  const audiences = Array.isArray(identity.aud) ? identity.aud : [identity.aud]
  if (!audiences.includes(clientId) || identity.exp * 1000 <= Date.now())
    throw new Error('OpenAI identity token was expired or intended for another client.')
  if (identity.nonce !== nonce) throw new Error('OpenAI sign-in nonce did not match.')
  return identity
}

export class ChatGPTAuth {
  private refreshPromise: Promise<string> | null = null
  private readonly path: string
  constructor(directory: string) {
    this.path = join(directory, 'chatgpt.auth')
  }

  private async read(): Promise<Record> {
    if (!encryptionAvailable())
      throw new Error(
        'OS-backed credential encryption is unavailable. Unlock your system keychain first.',
      )
    try {
      return z
        .object({
          version: z.literal(1),
          hostId: z.string(),
          clientId: z.string().optional(),
          subject: z.string().optional(),
          email: z.string().optional(),
          name: z.string().optional(),
          idToken: z.string().optional(),
          accessToken: z.string().optional(),
          refreshToken: z.string().optional(),
          expiresAt: z.number().optional(),
          scopes: z.array(z.string()),
          models: z.array(z.object({ slug: z.string(), displayName: z.string() })),
        })
        .parse(JSON.parse(safeStorage.decryptString(await readFile(this.path))))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      return {
        version: 1,
        hostId: `urn:uuid:${randomUUID()}`,
        scopes: [],
        models: [],
      }
    }
  }

  private async write(record: Record) {
    if (!encryptionAvailable())
      throw new Error(
        'OS-backed credential encryption is unavailable. Unlock your system keychain first.',
      )
    const temporary = this.path + '.tmp'
    await writeFile(temporary, safeStorage.encryptString(JSON.stringify(record)), { mode: 0o600 })
    await chmod(temporary, 0o600).catch(() => {})
    await rename(temporary, this.path)
  }

  async status() {
    if (!encryptionAvailable()) return { connected: false, email: null, models: [] }
    const record = await this.read()
    return {
      connected: Boolean(record.accessToken && record.refreshToken),
      email: record.email ?? null,
      models: record.models,
    }
  }

  async connect(signal: AbortSignal) {
    const previous = await this.read()
    const state = encode(randomBytes(32))
    const nonce = encode(randomBytes(32))
    const verifier = encode(randomBytes(48))
    const challenge = encode(createHash('sha256').update(verifier).digest())
    const callback = await new Promise<URL>((resolve, reject) => {
      let redirectUri = ''
      const server = createServer((request, response) => {
        if (!request.url?.startsWith('/auth/callback')) {
          response.writeHead(404).end()
          return
        }
        response.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
        })
        response.end(
          '<!doctype html><meta charset="utf-8"><title>CraftCV connected</title><style>body{font:16px system-ui;margin:48px;color:#282522}h1{font-size:24px}</style><h1>Return to CraftCV</h1><p>This browser tab can be closed.</p>',
        )
        server.close()
        resolve(new URL(request.url, redirectUri))
      })
      const fail = (error: Error) => {
        server.close()
        reject(error)
      }
      server.on('error', fail)
      server.listen(0, '127.0.0.1', async () => {
        const address = server.address()
        if (!address || typeof address === 'string') return fail(new Error('Sign-in port failed.'))
        redirectUri = `http://127.0.0.1:${address.port}/auth/callback`
        const parameters = new URLSearchParams({
          client_id: previous.clientId ?? 'dynamic_agent_client',
          ext_agent_host_id: previous.hostId,
          response_type: 'code',
          redirect_uri: redirectUri,
          scope: 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct',
          resource,
          state,
          nonce,
          code_challenge_method: 'S256',
          code_challenge: challenge,
        })
        if (!previous.clientId) parameters.set('agent_name_hint', 'CraftCV')
        else if (previous.email) parameters.set('login_hint', previous.email)
        if (previous.idToken) parameters.set('id_token_hint', previous.idToken)
        const timeout = setTimeout(() => fail(new Error('ChatGPT sign-in timed out.')), 300000)
        const abort = () => fail(new Error('ChatGPT sign-in cancelled.'))
        signal.addEventListener('abort', abort, { once: true })
        server.on('close', () => {
          clearTimeout(timeout)
          signal.removeEventListener('abort', abort)
        })
        try {
          await shell.openExternal(`${issuer}/api/accounts/authorize?${parameters}`)
        } catch (error) {
          fail(error instanceof Error ? error : new Error('Could not open the sign-in page.'))
        }
      })
    })
    if (callback.searchParams.get('state') !== state)
      throw new Error('ChatGPT sign-in state did not match.')
    if (callback.searchParams.get('error'))
      throw new Error('ChatGPT sign-in was declined or could not be completed.')
    const code = callback.searchParams.get('code')
    const callbackClientId = callback.searchParams.get('client_id')
    if (previous.clientId && callbackClientId && callbackClientId !== previous.clientId)
      throw new Error('OpenAI returned a different client registration than the selected account.')
    const issuedClientId = callbackClientId ?? previous.clientId
    if (!code || !issuedClientId) throw new Error('ChatGPT registration was incomplete.')
    const redirectUri = `${callback.origin}/auth/callback`
    const tokenResponse = await fetch(`${issuer}/api/accounts/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: issuedClientId,
        code,
        code_verifier: verifier,
        redirect_uri: redirectUri,
        resource,
      }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    })
    if (!tokenResponse.ok) throw new Error('OpenAI could not complete the token exchange.')
    const tokens = tokenSchema.parse(await tokenResponse.json())
    const scopes = tokens.scope.split(/\s+/)
    if (!requiredScopes.every((scope) => scopes.includes(scope)))
      throw new Error('ChatGPT plan usage permission was not granted.')
    if (!tokens.id_token) throw new Error('OpenAI returned no identity token.')
    const identity = await verifyIdToken(tokens.id_token, issuedClientId, nonce)
    if (
      previous.subject &&
      previous.clientId === issuedClientId &&
      identity.sub !== previous.subject
    )
      throw new Error('The selected ChatGPT account did not match the saved account.')
    const record: Record = {
      version: 1,
      hostId: previous.hostId,
      clientId: issuedClientId,
      subject: identity.sub,
      email: identity.email,
      name: identity.name,
      idToken: tokens.id_token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      scopes,
      models: [],
    }
    await this.write(record)
    await this.refreshModels(signal).catch(() => {})
  }

  async accessToken(signal: AbortSignal): Promise<string> {
    const record = await this.read()
    if (!record.accessToken || !record.refreshToken || !record.clientId)
      throw new Error('Connect ChatGPT in Settings first.')
    if ((record.expiresAt ?? 0) > Date.now() + 60000) return record.accessToken
    if (!this.refreshPromise) this.refreshPromise = this.refresh(record, signal)
    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async refresh(record: Record, signal: AbortSignal): Promise<string> {
    const response = await fetch(`${issuer}/api/accounts/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: record.clientId!,
        refresh_token: record.refreshToken!,
        resource,
      }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    })
    if (!response.ok) {
      if (response.status === 400 || response.status === 401)
        await this.write({
          version: 1,
          hostId: record.hostId,
          clientId: record.clientId,
          subject: record.subject,
          email: record.email,
          name: record.name,
          scopes: [],
          models: [],
        })
      throw new Error(
        response.status >= 500
          ? 'OpenAI sign-in is temporarily unavailable. Try again shortly.'
          : 'ChatGPT authorization expired. Connect again in Settings.',
      )
    }
    const tokens = tokenSchema.parse(await response.json())
    const scopes = tokens.scope.split(/\s+/)
    if (!requiredScopes.every((scope) => scopes.includes(scope))) {
      await this.write({
        version: 1,
        hostId: record.hostId,
        clientId: record.clientId,
        subject: record.subject,
        email: record.email,
        name: record.name,
        scopes: [],
        models: [],
      })
      throw new Error('ChatGPT plan usage permission is no longer available. Connect again.')
    }
    const next: Record = {
      ...record,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
      scopes,
    }
    await this.write(next)
    return next.accessToken!
  }

  async refreshModels(signal: AbortSignal) {
    const accessToken = await this.accessToken(signal)
    const response = await fetch(`${resource}/models`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    })
    if (!response.ok) throw new Error('Could not load models available to this ChatGPT account.')
    const payload = z
      .object({
        models: z.array(
          z.object({ slug: z.string(), display_name: z.string(), visibility: z.string() }),
        ),
      })
      .parse(await response.json())
    const record = await this.read()
    record.models = payload.models
      .filter((model) => model.visibility === 'list')
      .map((model) => ({ slug: model.slug, displayName: model.display_name }))
    await this.write(record)
  }

  async disconnect() {
    const record = await this.read()
    let remotelyRevoked = true
    if (record.refreshToken && record.clientId) {
      try {
        const metadata = await configuration()
        const response = await fetch(metadata.revocation_endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token: record.refreshToken,
            token_type_hint: 'refresh_token',
            client_id: record.clientId,
          }),
          signal: AbortSignal.timeout(30000),
        })
        remotelyRevoked = response.ok
      } catch {
        remotelyRevoked = false
      }
    }
    await this.write({
      version: 1,
      hostId: record.hostId,
      clientId: record.clientId,
      subject: record.subject,
      email: record.email,
      name: record.name,
      scopes: [],
      models: [],
    })
    if (!remotelyRevoked)
      throw new Error(
        'Signed out locally, but remote revocation could not be confirmed. Disconnect CraftCV in ChatGPT Settings.',
      )
  }

  async clear() {
    await unlink(this.path).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
}
