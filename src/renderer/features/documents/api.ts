import type { SaveResumeRequest } from '@shared/contracts'
import { RESTART_MESSAGE } from '@shared/runtime'
import { bridge, unwrap } from '@/common/api/bridge'

export type ExportFormat = 'pdf' | 'docx'

export const documentsApi = {
  import: () => unwrap(bridge().importResume()),
  get: async (id: string) => {
    // a preload from before getResume existed: the app needs a restart, not a retry
    if (typeof bridge()?.getResume !== 'function') throw new Error(RESTART_MESSAGE)
    return unwrap(bridge().getResume(id))
  },
  create: (sessionId: string | null = null) => unwrap(bridge().createResume(sessionId)),
  save: (request: SaveResumeRequest) => unwrap(bridge().saveResume(request)),
  export: (id: string, format: ExportFormat) => unwrap(bridge().exportDocument(id, format)),
  remove: (id: string) => unwrap(bridge().deleteResume(id)),
}
