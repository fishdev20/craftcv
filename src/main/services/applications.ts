import { randomUUID } from 'node:crypto'
import type {
  Application,
  ApplicationStatus,
  EnrichJobRequest,
  JobDetails,
  UpdateApplicationRequest,
} from '../../shared/contracts'
import { guessJobDetails } from '../domain/job-analysis'
import type { ServiceDeps } from './deps'
import { providerKey } from './provider-access'

const now = () => new Date().toISOString()

/** Fills the details the person left empty with what the job's text says. */
function withGuesses(job: JobDetails): JobDetails {
  const guess = guessJobDetails(job.description)
  return {
    ...job,
    role: job.role || guess.role,
    company: job.company || guess.company,
    location: job.location || guess.location,
  }
}

/** Applications: started by the new-application flow, then tracked to their outcome. */
export function createApplicationService(deps: ServiceDeps) {
  const { store, operations, progress, jobAnalysis } = deps

  function save(application: Application): Application {
    const next = { ...application, updatedAt: now() }
    store.applications.save(next)
    return next
  }

  return {
    /** Starts an application from its job; its requirements are analysed only on request. */
    create(input: JobDetails): Application {
      const job = withGuesses(input),
        created = now()
      return save({
        id: randomUUID(),
        createdAt: created,
        updatedAt: created,
        job,
        analysis: null,
        resumeId: null,
        projectIds: [],
        sessionId: null,
        step: 'analysis',
        status: 'preparing',
        history: [{ status: 'preparing', at: created }],
        appliedAt: null,
        notes: '',
      })
    },

    get: (id: string) => store.applications.get(id),

    /** Saves what changed; a new job description drops the analysis of the old one. */
    update(request: UpdateApplicationRequest): Application {
      const application = store.applications.get(request.id)
      const next = { ...application }
      if (request.job) {
        const described = request.job.description !== application.job.description
        next.job = described ? withGuesses(request.job) : request.job
        if (described) next.analysis = null
      }
      if (request.requirements && next.analysis)
        next.analysis = { ...next.analysis, ...request.requirements }
      if (request.resumeId !== undefined) {
        if (request.resumeId && !store.resumes.get(request.resumeId))
          throw new Error('CV not found. Choose it again.')
        next.resumeId = request.resumeId
      }
      if (request.projectIds) next.projectIds = request.projectIds
      if (request.sessionId !== undefined) next.sessionId = request.sessionId
      if (request.step) next.step = request.step
      if (request.notes !== undefined) next.notes = request.notes
      return save(next)
    },

    /**
     * Moves the application along. The first move to Applied, or past it to Interviewing or
     * an Offer, records when it was applied for.
     */
    setStatus(id: string, status: ApplicationStatus): Application {
      const application = store.applications.get(id)
      if (application.status === status) return application
      const at = now()
      return save({
        ...application,
        status,
        history: [...application.history, { status, at }].slice(-50),
        appliedAt:
          application.appliedAt ??
          (['applied', 'interviewing', 'offer'].includes(status) ? at : null),
      })
    },

    remove(id: string) {
      operations.assertIdle()
      store.applications.remove(id)
    },

    /**
     * Reads the job's details and requirements with a provider, with the person's consent.
     * Each stage, and the reply as it streams, goes to the window as it happens.
     */
    enrich: (request: EnrichJobRequest) => {
      const applicationId = request.id
      return operations
        .run(async (signal): Promise<Application> => {
          const application = store.applications.get(applicationId)
          jobAnalysis({ applicationId, stage: 'access' })
          const key = await providerKey(deps, request.provider, signal)
          progress({ phase: 'Analysing the job with AI', files: 0, total: 1 })
          jobAnalysis({ applicationId, stage: 'send' })
          const { analyzeJobWithAI } = await import('../ai/job-analysis')
          const { result, dropped, usage } = await analyzeJobWithAI(
            request,
            application.job,
            key,
            signal,
            (draft) => jobAnalysis({ applicationId, stage: 'stream', draft }),
          )
          signal.throwIfAborted()
          jobAnalysis({ applicationId, stage: 'check', draft: result, dropped })
          // the AI only fills details the person has not given
          const job = {
            ...application.job,
            role: application.job.role || result.role.trim(),
            company: application.job.company || result.company.trim(),
            location: application.job.location || result.location.trim(),
          }
          const saved = save({
            ...application,
            job,
            analysis: {
              mustHave: result.mustHave,
              niceToHave: result.niceToHave.filter((term) => !result.mustHave.includes(term)),
              keywords: result.keywords,
              responsibilities: result.responsibilities,
              source: 'ai',
              provider: request.provider,
              model: request.model,
              analyzedAt: now(),
              usage,
            },
          })
          jobAnalysis({ applicationId, stage: 'done', dropped })
          return saved
        })
        .catch((error: unknown) => {
          jobAnalysis({
            applicationId,
            stage: 'failed',
            // a cancelled run is stopped, not failed
            error:
              error instanceof Error && error.name === 'AbortError'
                ? 'Stopped.'
                : error instanceof Error
                  ? error.message.split('\n')[0]
                  : 'Analysis failed.',
          })
          throw error
        })
    },

    /** The job posting's address, checked again before anything opens it. */
    async link(id: string): Promise<string> {
      const { url } = store.applications.get(id).job
      if (!url) throw new Error('This application has no job link.')
      const { parseJobLink } = await import('../jobs/job-link')
      return parseJobLink(url).href
    },
  }
}
