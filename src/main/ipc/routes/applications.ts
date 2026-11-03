import { shell } from 'electron'
import {
  applicationStatusRequestSchema,
  enrichJobSchema,
  jobDetailsSchema,
  updateApplicationSchema,
} from '../../../shared/contracts'
import type { Services } from '../../services'
import { id, type Handle } from '../handle'

export function applicationRoutes(handle: Handle, { applications }: Services) {
  handle('createApplication', jobDetailsSchema, applications.create)
  handle('getApplication', id, applications.get)
  handle('updateApplication', updateApplicationSchema, applications.update)
  handle('setApplicationStatus', applicationStatusRequestSchema, (request) =>
    applications.setStatus(request.id, request.status),
  )
  handle('deleteApplication', id, applications.remove)
  handle('enrichJob', enrichJobSchema, applications.enrich)
  // the renderer names the application; the address comes from storage and is checked again
  handle('openApplicationLink', id, async (applicationId) =>
    shell.openExternal(await applications.link(applicationId)),
  )
}
