import type {
  AnalyzeRequest,
  Evidence,
  GenerateRequest,
  ReviewRequest,
  Session,
  Suggestion,
} from '../../shared/contracts'
import { requirements } from '../domain/evidence'
import {
  addStats,
  aiSuggestions,
  approvedSuggestions,
  createSession,
  emptyStats,
  interleaveByRepository,
  relevantEvidence,
  reviewSuggestion,
} from '../domain/session'
import { tailoredText } from '../domain/tailored-document'
import { scanRepository } from '../scanning/scan-repository'
import type { ServiceDeps } from './deps'
import { providerKey } from './provider-access'
import type { ExportFormat } from './resumes'

/** The tailoring workflow: analyze a job against projects, draft and review bullets, export. */
export function createTailoringService(deps: ServiceDeps) {
  const { store, paths, operations, progress, window } = deps
  return {
    /** Scans every repository of the selected projects locally and drafts suggestions. */
    analyze: (request: AnalyzeRequest) =>
      operations.run(async (signal): Promise<Session> => {
        const requested = requirements(request.job)
        if (!requested.length)
          throw new Error(
            'No supported technical requirements found. Include explicit skills such as React, Python, SQL, testing, or accessibility.',
          )
        const projects = request.projectIds.map((id) => {
          const project = store.projects.find(id)
          if (!project) throw new Error('Select the project again.')
          return project
        })
        const repositories = projects.flatMap((project) => project.repositories)
        if (!repositories.length) throw new Error('The selected project has no repositories.')
        if (request.resumeId && !store.resumes.get(request.resumeId))
          throw new Error('CV not found.')
        const evidence: Evidence[] = [],
          stats = emptyStats()
        for (const repository of repositories) {
          signal.throwIfAborted()
          const result = await scanRepository(
            paths.worker('scanner'),
            repository,
            paths.cache,
            signal,
            progress,
          )
          // Keep only bounded relevant evidence in SQLite and in the renderer.
          evidence.push(
            ...relevantEvidence(
              result.evidence,
              requested,
              repository,
              projects,
              repositories.length,
            ),
          )
          addStats(stats, result.stats)
        }
        signal.throwIfAborted()
        const session = createSession({
          job: request.job,
          requirements: requested,
          evidence: interleaveByRepository(evidence, repositories),
          stats,
          resumeId: request.resumeId,
        })
        store.sessions.save(session)
        return session
      }),

    /** Replaces a session's suggestions with AI drafts; once per session. */
    generate: (request: GenerateRequest) =>
      operations.run(async (signal): Promise<Session> => {
        const session = store.sessions.get(request.sessionId)
        if (session.usage)
          throw new Error(
            'Cloud generation has already been used for this session. Start a new analysis to generate again.',
          )
        const key = await providerKey(deps, request.provider, signal)
        const resume = session.resumeId ? store.resumes.get(session.resumeId) : undefined
        const { generate } = await import('../ai/cv-bullets')
        progress({ phase: 'Generating with ' + request.provider, files: 0, total: 1 })
        const result = await generate(request, session, resume?.text ?? '', key, signal)
        signal.throwIfAborted()
        session.suggestions = aiSuggestions(session, result.data.bullets)
        session.usage = result.usage ?? { input: 0, output: 0 }
        store.sessions.save(session)
        return session
      }),

    review(request: ReviewRequest): Suggestion {
      const previous = store.sessions.getSuggestion(request.id)
      const next = reviewSuggestion(previous, request, store.sessions.get(previous.sessionId))
      store.sessions.saveSuggestion(next)
      return next
    },

    getSession: (id: string) => store.sessions.get(id),

    deleteSession(id: string) {
      operations.assertIdle()
      store.sessions.remove(id)
    },

    /** Exports the session's CV text with its approved bullets. */
    export: (sessionId: string, format: ExportFormat) =>
      operations.run(async (signal) => {
        const session = store.sessions.get(sessionId),
          resume = session.resumeId ? store.resumes.get(session.resumeId) : undefined
        const approved = approvedSuggestions(session)
        if (!approved.length) throw new Error('Approve at least one suggestion before exporting.')
        const { exportSessionResume } = await import('../documents/document-files')
        return exportSessionResume(
          window(),
          paths.worker('document'),
          tailoredText(resume, approved),
          format,
          signal,
        )
      }),
  }
}
