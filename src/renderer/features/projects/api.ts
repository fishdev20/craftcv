import type { AnalyzeProjectRequest } from '@shared/contracts'
import { bridge, unwrap } from '@/common/api/bridge'

export const projectsApi = {
  selectRepository: () => unwrap(bridge().selectRepository()),
  importFolder: () => unwrap(bridge().importRepositoryFolder()),
  remove: (id: string) => unwrap(bridge().removeProject(id)),
  analyze: (request: AnalyzeProjectRequest) => unwrap(bridge().analyzeProject(request)),
}
