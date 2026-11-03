import type { ApiKeyProvider } from '@shared/contracts'
import { action, busyAction, notify, refreshDashboard } from '@/common/store/app-store'
import { settingsApi } from './api'

/** Resolves to true once saved; on failure the error toast shows and the typed key is kept. */
export const saveKey = (provider: ApiKeyProvider, key: string) =>
  action(async () => {
    await settingsApi.saveKey(provider, key)
    await refreshDashboard()
    notify(key ? 'API key saved using OS-backed encryption.' : 'API key removed.')
    return true
  })

const chatgpt = {
  connect: [
    settingsApi.connectChatGPT,
    'ChatGPT connected. CraftCV can now use your eligible plan.',
  ],
  disconnect: [settingsApi.disconnectChatGPT, 'ChatGPT disconnected.'],
  models: [settingsApi.refreshChatGPTModels, 'ChatGPT models refreshed.'],
} as const

/** Sign-in, sign-out and model refresh for a ChatGPT plan; each one waits on the browser or network. */
export const chatgptAction = (operation: keyof typeof chatgpt) =>
  busyAction(async () => {
    const [call, message] = chatgpt[operation]
    await call()
    await refreshDashboard()
    notify(message)
  })
