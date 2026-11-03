import { z } from 'zod'
import { setTimeout as delay } from 'node:timers/promises'
import type { Provider } from '../../shared/contracts'
import { errorFromBody, providerError, providerErrorSchema } from './provider-errors'

type ProviderOutput = { text: string; usage: { input: number; output: number } | null }
// Providers send null as often as they omit a field, so every optional field is nullish.
const usageSchema = z
  .object({ input_tokens: z.number().nullish(), output_tokens: z.number().nullish() })
  .nullish()
const toUsage = (usage: z.infer<typeof usageSchema>): ProviderOutput['usage'] =>
  usage ? { input: usage.input_tokens ?? 0, output: usage.output_tokens ?? 0 } : null

/** Every stream event is checked only for the fields CraftCV reads; the rest are ignored. */
const streamEvent = z.object({
  type: z.string(),
  delta: z.unknown().optional(),
  text: z.unknown().optional(),
  response: z
    .object({
      usage: usageSchema,
      error: providerErrorSchema,
      status: z.string().nullish(),
      incomplete_details: z.object({ reason: z.string().nullish() }).nullish(),
    })
    .nullish(),
  error: providerErrorSchema,
})

const UNREADABLE_REPLY =
  'The AI provider sent a reply CraftCV could not read. Try again, or choose a different model.'

/** Parses a provider's JSON reply text against a schema, with a message a person can act on. */
export function parseReply<T extends z.ZodType>(schema: T, text: string): z.infer<T> {
  const trimmed = text.trim()
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/iu.exec(trimmed)?.[1]
  const firstObject = trimmed.indexOf('{')
  const lastObject = trimmed.lastIndexOf('}')
  const embedded =
    firstObject >= 0 && lastObject > firstObject
      ? trimmed.slice(firstObject, lastObject + 1)
      : undefined
  for (const candidate of new Set([trimmed, fenced, embedded].filter(Boolean))) {
    try {
      let value: unknown = JSON.parse(candidate as string)
      if (typeof value === 'string') value = JSON.parse(value)
      const parsed = schema.safeParse(value)
      if (parsed.success) return parsed.data
    } catch {
      // Try the next conservative wrapper normalization before rejecting the reply.
    }
  }
  throw new Error(
    'The AI reply was not in the expected format. Try again, or choose a different model.',
  )
}

const responseEnvelope = z.object({
  output: z
    .array(
      z.object({
        content: z.array(z.object({ type: z.string(), text: z.string().nullish() })).nullish(),
      }),
    )
    .nullish(),
  content: z.array(z.object({ type: z.string(), text: z.string().nullish() })).nullish(),
  usage: usageSchema,
  status: z.string().nullish(),
  stop_reason: z.string().nullish(),
  incomplete_details: z.object({ reason: z.string().nullish() }).nullish(),
})

const INCOMPLETE_REPLY =
  'The AI reply was cut off before the project map was complete. Try again with a model that supports a larger output, or import a more specific project folder.'

/** Each server-sent event's data, in order, as the stream arrives. */
async function readEvents(response: Response, consume: (data: string) => void) {
  if (!response.body) throw new Error('The AI provider returned an empty response stream.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  const take = (block: string) => {
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n')
    if (data && data !== '[DONE]') consume(data)
  }
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value, { stream: !done })
    const blocks = buffer.split(/\r?\n\r?\n/)
    buffer = blocks.pop() ?? ''
    for (const block of blocks) take(block)
    if (done) break
  }
  if (buffer.trim()) take(buffer)
}

const readEvent = <T extends z.ZodType>(schema: T, data: string): z.infer<T> => {
  try {
    return schema.parse(JSON.parse(data))
  } catch {
    throw new Error(UNREADABLE_REPLY)
  }
}

/** An OpenAI Responses stream, from the API or a ChatGPT plan. */
async function readOpenAIStream(
  response: Response,
  provider: Provider,
  onText?: (text: string) => void,
): Promise<ProviderOutput> {
  let text = ''
  let completed = false
  let usage: ProviderOutput['usage'] = null
  await readEvents(response, (data) => {
    const event = readEvent(streamEvent, data)
    if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
      text += event.delta
      onText?.(text)
    }
    if (event.type === 'response.output_text.done' && !text && typeof event.text === 'string')
      text = event.text
    if (event.type === 'response.completed') {
      completed = true
      usage = toUsage(event.response?.usage)
    }
    if (event.type === 'response.incomplete' && !event.response?.error)
      throw new Error(INCOMPLETE_REPLY)
    if (
      event.type === 'response.failed' ||
      event.type === 'response.incomplete' ||
      event.type === 'error'
    ) {
      throw providerError(provider, event.response?.error ?? event.error)
    }
  })
  if (!completed) throw new Error('The AI reply ended before it was complete. Try again.')
  if (!text) throw new Error('The provider returned no structured text (possibly a refusal).')
  return { text, usage }
}

const anthropicEvent = z.object({
  type: z.string(),
  delta: z
    .object({
      type: z.string().nullish(),
      text: z.string().nullish(),
      stop_reason: z.string().nullish(),
    })
    .nullish(),
  message: z.object({ usage: usageSchema }).nullish(),
  usage: usageSchema,
  error: providerErrorSchema,
})

/** An Anthropic Messages stream: the text deltas, then why it stopped and what it used. */
async function readAnthropicStream(
  response: Response,
  onText?: (text: string) => void,
): Promise<ProviderOutput> {
  let text = ''
  let input = 0,
    output = 0
  let stopReason: string | null | undefined
  let completed = false
  await readEvents(response, (data) => {
    const event = readEvent(anthropicEvent, data)
    if (event.type === 'message_start') input = event.message?.usage?.input_tokens ?? 0
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      text += event.delta.text ?? ''
      onText?.(text)
    }
    if (event.type === 'message_delta') {
      stopReason = event.delta?.stop_reason
      output = event.usage?.output_tokens ?? output
    }
    if (event.type === 'message_stop') completed = true
    if (event.type === 'error') throw providerError('anthropic', event.error)
  })
  if (stopReason === 'max_tokens') throw new Error(INCOMPLETE_REPLY)
  if (!completed) throw new Error('The AI reply ended before it was complete. Try again.')
  if (!text) throw new Error('The provider returned no structured text (possibly a refusal).')
  return { text, usage: { input, output } }
}

async function readOutput(
  response: Response,
  provider: Provider,
  onText?: (text: string) => void,
): Promise<ProviderOutput> {
  if (provider === 'chatgpt' || (provider === 'openai' && onText))
    return readOpenAIStream(response, provider, onText)
  if (onText) return readAnthropicStream(response, onText)
  const parsed = responseEnvelope.safeParse(await response.json().catch(() => undefined))
  if (!parsed.success) throw new Error(UNREADABLE_REPLY)
  const envelope = parsed.data
  if (
    envelope.status === 'incomplete' ||
    envelope.stop_reason === 'max_tokens' ||
    envelope.incomplete_details?.reason === 'max_output_tokens'
  )
    throw new Error(INCOMPLETE_REPLY)
  const text = (
    provider === 'openai'
      ? envelope.output?.flatMap((item) => item.content ?? [])
      : envelope.content
  )
    ?.filter((item) => (provider === 'openai' ? item.type === 'output_text' : item.type === 'text'))
    .map((item) => item.text ?? '')
    .join('')
  if (!text) throw new Error('The provider returned no structured text (possibly a refusal).')
  return {
    text,
    usage: toUsage(envelope.usage),
  }
}

/** A conservative input-token upper estimate: UTF-8 bytes of everything sent, plus overhead. */
const estimateTokens = (...parts: string[]) => Buffer.byteLength(parts.join('')) + 256

/**
 * Refuses a request whose conservative estimate, plus the output allowance, exceeds the
 * session budget the person set. `hint` says what to shorten.
 */
export function assertWithinBudget(
  budget: number | null | undefined,
  parts: string[],
  outputTokens: number,
  hint: string,
) {
  const total = estimateTokens(...parts) + outputTokens
  if (budget && total > budget)
    throw new Error(
      `The conservative request estimate (${total} tokens) exceeds your session budget. ${hint}`,
    )
}

type StructuredRequest = {
  provider: Provider
  model: string
  /** An API key, or a ChatGPT plan access token. */
  key: string
  instructions: string
  content: string
  /** A JSON schema the reply must match, and its name for OpenAI. */
  schema: object
  schemaName: string
  outputTokens: number
  timeoutMs: number
  /** Total attempts; 5xx replies (and 429 outside ChatGPT plans) are retried with backoff. */
  attempts?: number
  /** Streams the reply, calling this with all the text received so far after each piece. */
  onText?: (text: string) => void
}

/**
 * One structured-output request to OpenAI, a ChatGPT plan (OpenAI's API, streamed) or
 * Anthropic, returning the reply text and the usage the provider reported. With `onText`
 * every provider streams. Nothing is stored by the provider (`store: false` on OpenAI).
 */
export async function requestStructured(
  request: StructuredRequest,
  signal: AbortSignal,
): Promise<ProviderOutput> {
  const { provider, model, key, instructions, content, schema, schemaName, outputTokens, onText } =
    request
  const openai = provider !== 'anthropic'
  const chatgpt = provider === 'chatgpt'
  const stream = chatgpt || Boolean(onText)
  const url = openai
    ? 'https://api.openai.com/v1/responses'
    : 'https://api.anthropic.com/v1/messages'
  const body = openai
    ? {
        model,
        store: false,
        instructions,
        input: chatgpt ? [{ role: 'user', content }] : content,
        ...(chatgpt ? {} : { max_output_tokens: outputTokens }),
        ...(stream && { stream: true }),
        text: { format: { type: 'json_schema', name: schemaName, strict: true, schema } },
      }
    : {
        model,
        system: instructions,
        messages: [{ role: 'user', content }],
        max_tokens: outputTokens,
        output_config: { format: { type: 'json_schema', schema } },
        ...(stream && { stream: true }),
      }
  const attempts = request.attempts ?? 1
  let response: Response | undefined
  for (let attempt = 0; attempt < attempts; attempt++) {
    signal.throwIfAborted()
    response = await fetch(url, {
      method: 'POST',
      headers: openai
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }
        : {
            'Content-Type': 'application/json',
            'x-api-key': key,
            'anthropic-version': '2023-06-01',
          },
      body: JSON.stringify(body),
      signal: AbortSignal.any([signal, AbortSignal.timeout(request.timeoutMs)]),
    })
    if (response.ok) break
    const retryable =
      [500, 502, 503, 504].includes(response.status) || (!chatgpt && response.status === 429)
    if (!retryable || attempt === attempts - 1) {
      const error = errorFromBody(await response.text().catch(() => ''))
      throw providerError(provider, error, response.status)
    }
    await response.body?.cancel()
    await delay(750 * 2 ** attempt, undefined, { signal })
  }
  if (!response?.ok) throw new Error('Provider request failed.')
  return readOutput(response, provider, onText)
}
