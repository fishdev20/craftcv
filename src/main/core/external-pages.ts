import type { ExternalPage } from '../../shared/contracts'

/** The only pages CraftCV opens in the browser: the renderer names one, never a URL. */
export const externalPages: Record<ExternalPage, string> = {
  'openai-keys': 'https://platform.openai.com/api-keys',
  'anthropic-keys': 'https://platform.claude.com/settings/keys',
  'chatgpt-plans': 'https://chatgpt.com/pricing',
  'chatgpt-usage': 'https://chatgpt.com/codex/settings/usage',
}

/** An error whose fix lives on a provider's own page; the error banner links to each one. */
export class ActionableError extends Error {
  constructor(
    message: string,
    readonly pages: ExternalPage[],
  ) {
    super(message)
  }
}
