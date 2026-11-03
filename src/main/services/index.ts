import { createApplicationService } from './applications'
import { createDashboardService } from './dashboard'
import { createJobService } from './jobs'
import type { ServiceDeps } from './deps'
import { createProjectService } from './projects'
import { createResumeService } from './resumes'
import { createSettingsService } from './settings'
import { createTailoringService } from './tailoring'

export type { ServiceDeps } from './deps'

export function createServices(deps: ServiceDeps) {
  return {
    operations: deps.operations,
    dashboard: createDashboardService(deps),
    projects: createProjectService(deps),
    resumes: createResumeService(deps),
    tailoring: createTailoringService(deps),
    jobs: createJobService(deps),
    applications: createApplicationService(deps),
    settings: createSettingsService(deps),
  }
}

export type Services = ReturnType<typeof createServices>
