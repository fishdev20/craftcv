import { z } from 'zod'
import {
  generateSchema,
  jobLinkSchema,
  requestSchema,
  reviewSchema,
} from '../../../shared/contracts'
import type { Services } from '../../services'
import { exportFormat, id, none, type Handle } from '../handle'

export function tailoringRoutes(handle: Handle, { tailoring, jobs }: Services) {
  handle('importJobLink', jobLinkSchema, jobs.importLink)
  // the posting window loads the link last imported; no address is sent with these
  handle('openJobPage', none, jobs.openPage)
  handle('useJobPage', none, jobs.usePage)
  handle('closeJobPage', none, jobs.closePage)
  handle('analyze', requestSchema, tailoring.analyze)
  handle('generate', generateSchema, tailoring.generate)
  handle('review', reviewSchema, tailoring.review)
  handle('getSession', id, tailoring.getSession)
  handle('deleteSession', id, tailoring.deleteSession)
  handle('exportResume', z.object({ sessionId: id, format: exportFormat }), (request) =>
    tailoring.export(request.sessionId, request.format),
  )
}
