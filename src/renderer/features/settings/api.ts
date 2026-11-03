import type { ApiKeyProvider } from '@shared/contracts'
import { bridge, unwrap } from '@/common/api/bridge'

export const settingsApi = {
  /** An empty key removes the stored one. */
  saveKey: (provider: ApiKeyProvider, key: string) => unwrap(bridge().saveKey(provider, key)),
  connectChatGPT: () => unwrap(bridge().connectChatGPT()),
  disconnectChatGPT: () => unwrap(bridge().disconnectChatGPT()),
  refreshChatGPTModels: () => unwrap(bridge().refreshChatGPTModels()),
}
