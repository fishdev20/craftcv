import type { ApiKeyProvider } from '../../shared/contracts'
import type { ServiceDeps } from './deps'

/** Provider credentials: API keys, and the ChatGPT plan's browser sign-in. */
export function createSettingsService({ credentials, chatgpt, operations, progress }: ServiceDeps) {
  return {
    /** An empty key removes the stored one. */
    saveKey: (provider: ApiKeyProvider, key: string) => credentials.set(provider, key),

    connectChatGPT: () =>
      operations.run(async (signal) => {
        progress({ phase: 'Waiting for ChatGPT sign-in', files: 0, total: 1 })
        await chatgpt.connect(signal)
      }),

    disconnectChatGPT: () => chatgpt.disconnect(),

    refreshChatGPTModels: () => operations.run((signal) => chatgpt.refreshModels(signal)),
  }
}
