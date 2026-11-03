import type { IpcMainInvokeEvent } from 'electron'
import type { Services } from '../services'
import { createHandle } from './handle'
import { appRoutes } from './routes/app'
import { applicationRoutes } from './routes/applications'
import { projectRoutes } from './routes/projects'
import { resumeRoutes } from './routes/resumes'
import { settingsRoutes } from './routes/settings'
import { tailoringRoutes } from './routes/tailoring'

/** Serves every `craftcv:*` channel the preload exposes, each validated and sender-checked. */
export function registerIpc(
  services: Services,
  assertTrusted: (event: IpcMainInvokeEvent) => void,
) {
  const handle = createHandle(assertTrusted)
  appRoutes(handle, services)
  projectRoutes(handle, services)
  resumeRoutes(handle, services)
  tailoringRoutes(handle, services)
  settingsRoutes(handle, services)
  applicationRoutes(handle, services)
}
