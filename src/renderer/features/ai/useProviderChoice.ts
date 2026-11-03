import { useState } from 'react'
import type { Provider } from '@shared/contracts'
import { useAppStore } from '@/common/store/app-store'
import { defaultModel, type ChatGPTModel } from './providers'

const NO_MODELS: ChatGPTModel[] = []

/**
 * The provider, model and consent of one cloud request. Changing the provider resets the
 * model to that provider's default and withdraws consent, which was given to the old one.
 */
export function useProviderChoice() {
  const chatgptModels = useAppStore((s) => s.dashboard?.chatgpt.models) ?? NO_MODELS
  const keys = useAppStore((s) => s.dashboard?.keys)
  const [provider, setProviderState] = useState<Provider>('openai'),
    [model, setModel] = useState('gpt-4o-mini'),
    [consent, setConsent] = useState(false)
  return {
    provider,
    model,
    consent,
    chatgptModels,
    /** Whether this provider has a key or account connected in Settings. */
    connected: !!keys?.[provider],
    setModel,
    setConsent,
    setProvider: (next: Provider) => {
      setProviderState(next)
      setModel(defaultModel(next, chatgptModels))
      setConsent(false)
    },
  }
}

export type ProviderChoice = ReturnType<typeof useProviderChoice>
