import type { Provider } from '@shared/contracts'

export type ChatGPTModel = { slug: string; displayName: string }

export const providerName = (provider: Provider) =>
  provider === 'chatgpt' ? 'ChatGPT' : provider === 'openai' ? 'OpenAI' : 'Anthropic'

export const defaultModel = (provider: Provider, chatgptModels: ChatGPTModel[]) =>
  provider === 'chatgpt'
    ? (chatgptModels[0]?.slug ?? 'gpt-6.1-sol')
    : provider === 'openai'
      ? 'gpt-4o-mini'
      : 'claude-sonnet-4-6'

export const providerOptions = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'chatgpt', label: 'ChatGPT plan' },
  { id: 'anthropic', label: 'Anthropic' },
]
