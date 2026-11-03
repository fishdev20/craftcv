import { z } from 'zod'
import { saveResumeSchema } from '../../../shared/contracts'
import type { Services } from '../../services'
import { exportFormat, id, none, type Handle } from '../handle'

export function resumeRoutes(handle: Handle, { resumes }: Services) {
  handle('importResume', none, resumes.import)
  handle('getResume', id, resumes.get)
  handle('createResume', id.nullable(), resumes.create)
  handle('saveResume', saveResumeSchema, resumes.save)
  handle('deleteResume', id, resumes.remove)
  handle('exportDocument', z.object({ id, format: exportFormat }), (request) =>
    resumes.export(request.id, request.format),
  )
}
