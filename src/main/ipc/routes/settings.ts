import { z } from 'zod'
import { apiKeyProviderSchema } from '../../../shared/contracts'
import type { Services } from '../../services'
import { none, type Handle } from '../handle'

export function settingsRoutes(handle: Handle, { settings }: Services) {
  handle(
    'saveKey',
    z.object({ provider: apiKeyProviderSchema, key: z.string().trim().max(1000) }),
    ({ provider, key }) => settings.saveKey(provider, key),
  )
  handle('connectChatGPT', none, settings.connectChatGPT)
  handle('disconnectChatGPT', none, settings.disconnectChatGPT)
  handle('refreshChatGPTModels', none, settings.refreshChatGPTModels)
}
