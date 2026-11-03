import { z } from 'zod'
import type { Provider } from '../../shared/contracts'
import { ActionableError } from '../core/external-pages'

/**
 * The error a provider reports, in any of the shapes OpenAI, ChatGPT plans and Anthropic use.
 * Every field is optional: the reply is only ever used to choose words for a person.
 */
export const providerErrorSchema = z
  .object({
    type: z.string().nullish(),
    code: z.string().nullish(),
    message: z.string().nullish(),
    /** ChatGPT plan limits: when the limit lifts, in Unix seconds, or seconds from now. */
    resets_at: z.number().nullish(),
    resets_in_seconds: z.number().nullish(),
  })
  .nullish()
type ProviderError = z.infer<typeof providerErrorSchema>

const names: Record<Provider, string> = {
  chatgpt: 'ChatGPT',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
}

/** "5:44 PM" today, "Tue 5:44 PM" on another day. */
function resetTime(error: NonNullable<ProviderError>, now: Date) {
  const at = error.resets_at
    ? new Date(error.resets_at * 1000)
    : error.resets_in_seconds
      ? new Date(now.getTime() + error.resets_in_seconds * 1000)
      : null
  if (!at || Number.isNaN(at.getTime())) return null
  const time = at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return at.toDateString() === now.toDateString()
    ? `at ${time}`
    : `on ${at.toLocaleDateString([], { weekday: 'short' })} ${time}`
}

/**
 * A provider failure in words a person can act on: a short title, a newline, then what to do.
 * The error banner shows the first line as its title. A ChatGPT plan limit links to the plan
 * and usage pages, the only places it can be lifted.
 */
export function providerError(
  provider: Provider,
  error: ProviderError,
  status?: number,
  now = new Date(),
): Error {
  const message = describeProviderError(provider, error, status, now)
  return isUsageLimit(error)
    ? new ActionableError(message, ['chatgpt-plans', 'chatgpt-usage'])
    : new Error(message)
}

const isUsageLimit = (error: ProviderError) =>
  /usage_limit/.test(`${error?.code ?? ''} ${error?.type ?? ''}`)

/** The words alone, for `providerError`. */
function describeProviderError(
  provider: Provider,
  error: ProviderError,
  status?: number,
  now = new Date(),
): string {
  const name = names[provider]
  const id = `${error?.code ?? ''} ${error?.type ?? ''}`
  if (isUsageLimit(error)) {
    const when = error ? resetTime(error, now) : null
    return `You’re out of ChatGPT plan messages\nYour limit resets ${when ?? 'soon'}. Upgrade your plan or check your usage on ChatGPT, or choose a different provider until then.`
  }
  if (/insufficient_quota|billing|credit/.test(id))
    return `Your ${name} account has no credit left\nAdd credit in your ${name} billing settings, or choose a different provider.`
  if (/rate_limit/.test(id) || status === 429)
    return `${name} is limiting requests right now\nWait a minute, then try again.`
  if (/context_length|too_long|request_too_large/.test(id) || status === 413)
    return `This request is too large for the model\nSelect fewer projects or shorten the job description, then try again.`
  if (/model_not_found/.test(id) || status === 404)
    return `This model isn’t available to your ${name} account\nChoose a different model and try again.`
  if (/authentication|invalid_api_key|permission/.test(id) || status === 401 || status === 403)
    return provider === 'chatgpt'
      ? `ChatGPT didn’t accept your sign-in\nDisconnect and connect ChatGPT again in Settings.`
      : `${name} didn’t accept your API key\nSave a new key in Settings, then try again.`
  if (/overloaded|server_error/.test(id) || (status && status >= 500))
    return `${name} is having trouble right now\nTry again in a few minutes.`
  return `${name} couldn’t complete the request\n${error?.message ?? 'Try again, or choose a different model.'}`
}

/** Reads the error out of a failed HTTP reply body, whichever provider sent it. */
export function errorFromBody(body: string): ProviderError {
  try {
    const parsed: unknown = JSON.parse(body)
    const inner =
      parsed && typeof parsed === 'object' && 'error' in parsed
        ? (parsed as { error: unknown }).error
        : parsed
    const error = providerErrorSchema.safeParse(inner)
    if (error.success && error.data) return error.data
  } catch {
    // not JSON: the status alone chooses the words
  }
  return null
}
