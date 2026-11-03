import type { AnalyzeRequest, GenerateRequest, ReviewRequest } from '@shared/contracts'
import { bridge, unwrap } from '@/common/api/bridge'

export const workspaceApi = {
  analyze: (request: AnalyzeRequest) => unwrap(bridge().analyze(request)),
  generate: (request: GenerateRequest) => unwrap(bridge().generate(request)),
  review: (request: ReviewRequest) => unwrap(bridge().review(request)),
  importJobLink: (link: string) => unwrap(bridge().importJobLink(link)),
  openJobPage: () => unwrap(bridge().openJobPage()),
  useJobPage: () => unwrap(bridge().useJobPage()),
  closeJobPage: () => unwrap(bridge().closeJobPage()),
  getSession: (id: string) => unwrap(bridge().getSession(id)),
  deleteSession: (id: string) => unwrap(bridge().deleteSession(id)),
  exportResume: (sessionId: string, format: 'pdf' | 'docx') =>
    unwrap(bridge().exportResume(sessionId, format)),
  copy: (text: string) => unwrap(bridge().copy(text)),
}
