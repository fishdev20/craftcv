import type { Provider } from '../../shared/contracts'
import type { ServiceDeps } from './deps'

/** The secret for a cloud request: a fresh ChatGPT plan token, or the stored API key. */
export async function providerKey(
  { chatgpt, credentials }: Pick<ServiceDeps, 'chatgpt' | 'credentials'>,
  provider: Provider,
  signal: AbortSignal,
): Promise<string> {
  const key =
    provider === 'chatgpt' ? await chatgpt.accessToken(signal) : await credentials.get(provider)
  if (!key) throw new Error('Connect an AI provider in Settings first.')
  return key
}
