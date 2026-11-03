import { analyzeProjectSchema } from '../../../shared/contracts'
import type { Services } from '../../services'
import { id, none, type Handle } from '../handle'

export function projectRoutes(handle: Handle, { projects }: Services) {
  // one picker serves both: a folder may be a repository or hold several
  handle('selectRepository', none, projects.import)
  handle('importRepositoryFolder', none, projects.import)
  handle('removeRepository', id, projects.removeRepository)
  handle('removeProject', id, projects.remove)
  handle('analyzeProject', analyzeProjectSchema, projects.analyze)
}
