import type { Dashboard } from '../../shared/contracts'
import type { ServiceDeps } from './deps'

export function createDashboardService({ store, credentials, chatgpt }: ServiceDeps) {
  return {
    /** Everything the renderer lists, and which providers are connected (never the secrets). */
    async get(): Promise<Dashboard> {
      const chatgptStatus = await chatgpt.status()
      return {
        projects: store.projects.list(),
        repositories: store.projects.repositories(),
        resumes: store.resumes.list(),
        sessions: store.sessions.list(),
        applications: store.applications.list(),
        keys: {
          openai: await credentials.has('openai'),
          chatgpt: chatgptStatus.connected,
          anthropic: await credentials.has('anthropic'),
        },
        chatgpt: chatgptStatus,
      }
    },
  }
}
