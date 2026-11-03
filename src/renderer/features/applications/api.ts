import type {
  ApplicationStatus,
  EnrichJobRequest,
  JobDetails,
  UpdateApplicationRequest,
} from '@shared/contracts'
import { bridge, unwrap } from '@/common/api/bridge'

export const applicationsApi = {
  create: (job: JobDetails) => unwrap(bridge().createApplication(job)),
  get: (id: string) => unwrap(bridge().getApplication(id)),
  update: (request: UpdateApplicationRequest) => unwrap(bridge().updateApplication(request)),
  setStatus: (id: string, status: ApplicationStatus) =>
    unwrap(bridge().setApplicationStatus(id, status)),
  remove: (id: string) => unwrap(bridge().deleteApplication(id)),
  enrich: (request: EnrichJobRequest) => unwrap(bridge().enrichJob(request)),
  openLink: (id: string) => unwrap(bridge().openApplicationLink(id)),
}
