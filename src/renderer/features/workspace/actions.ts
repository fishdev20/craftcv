import type {
  ApplicationStep,
  JobImport,
  Provider,
  Session,
  Suggestion,
  UpdateApplicationRequest,
} from '@shared/contracts'
import { action, busyAction, notify, refreshDashboard, showError } from '@/common/store/app-store'
import { applicationsApi } from '@/features/applications/api'
import { documentsApi } from '@/features/documents/api'
import { workspaceApi } from './api'
import {
  forgetSession,
  loadApplication,
  replaceSuggestion,
  resumeSession,
  selectResume,
  setApplication,
  setJob,
  setLinked,
  setSession,
  setStep,
  useWorkspaceStore,
} from './store'

type AIRequest = { provider: Provider; model: string; tokenBudget: number | null }

// The CV and projects chosen for an application are saved as they change, so it reopens from
// the tracker with them, whether or not its analysis ran.
let pending: ReturnType<typeof setTimeout> | undefined
useWorkspaceStore.subscribe((state, previous) => {
  const { application, selected, resumeId } = state
  // A queued choice save belongs to the old application. Never let it run after switching
  // applications or starting over (including after a view unmounts).
  if (application?.id !== previous.application?.id) {
    clearTimeout(pending)
    pending = undefined
  }
  if (!application || (selected === previous.selected && resumeId === previous.resumeId)) return
  const changed: UpdateApplicationRequest = { id: application.id }
  if (selected.join() !== application.projectIds.join()) changed.projectIds = selected
  if (resumeId && resumeId !== application.resumeId) changed.resumeId = resumeId
  if (Object.keys(changed).length === 1) return
  clearTimeout(pending)
  pending = setTimeout(() => {
    void applicationsApi
      .update(changed)
      .then((saved) => {
        if (useWorkspaceStore.getState().application?.id === saved.id) setApplication(saved)
      })
      .catch(showError)
  }, 400)
})

/** Shows a step, and remembers it on the application so the tracker can return to it. */
export function goToStep(step: ApplicationStep) {
  setStep(step)
  const { application } = useWorkspaceStore.getState()
  if (application && application.step !== step)
    void action(async () =>
      setApplication(await applicationsApi.update({ id: application.id, step })),
    )
}

/**
 * Leaves the job step: the first time, this creates the application (and its card on the
 * tracker) with the job's requirements read locally; later, it saves an edited description.
 */
export const continueFromJob = () =>
  action(async () => {
    const { job, linked, application } = useWorkspaceStore.getState()
    const details = {
      role: application?.job.role ?? linked?.role ?? '',
      company: application?.job.company ?? linked?.company ?? '',
      location: application?.job.location ?? linked?.location ?? '',
      url: linked?.url ?? application?.job.url ?? null,
      description: job.trim(),
      source:
        linked || application?.job.source === 'link' ? ('link' as const) : ('manual' as const),
    }
    const saved = application
      ? await applicationsApi.update({ id: application.id, job: details, step: 'analysis' })
      : await applicationsApi.create(details)
    setApplication(saved)
    setStep('analysis')
    if (!application) {
      await refreshDashboard()
      notify('Application started. Track it under Applications.')
    }
  })

/** Saves the job's confirmed details and moves on to the CV. */
export const continueFromAnalysis = (details: {
  role: string
  company: string
  location: string
}) =>
  action(async () => {
    const { application } = useWorkspaceStore.getState()
    if (!application) return
    setApplication(
      await applicationsApi.update({
        id: application.id,
        job: { ...application.job, ...details },
        step: 'cv',
      }),
    )
    setStep('cv')
    await refreshDashboard()
  })

/** Reads the job again with AI, with the person's consent. */
/** Analyses the job's requirements with AI; resolves to true when it did. */
export const enrichJob = (request: AIRequest) =>
  busyAction(async () => {
    const { application } = useWorkspaceStore.getState()
    if (!application) return
    setApplication(await applicationsApi.enrich({ id: application.id, consent: true, ...request }))
    await refreshDashboard()
    notify('Job analysed with AI.')
    return true
  })

/** Saves the chosen master CV and moves on to the projects. */
export const continueFromCv = () =>
  action(async () => {
    const { application, resumeId } = useWorkspaceStore.getState()
    if (application)
      setApplication(
        await applicationsApi.update({ id: application.id, resumeId, step: 'projects' }),
      )
    setStep('projects')
  })

/** Starts a blank CV as the master CV, for someone who has none yet. */
export const startBlankCv = () =>
  action(async () => {
    const cv = await documentsApi.create(null)
    await refreshDashboard()
    selectResume(cv.id)
    notify('Blank CV created. Fill it in under Documents whenever you like.')
  })

/** Moves the application to Applied on the tracker. */
export const markApplied = () =>
  action(async () => {
    const { application } = useWorkspaceStore.getState()
    if (!application) return
    setApplication(await applicationsApi.setStatus(application.id, 'applied'))
    await refreshDashboard()
    notify('Marked as applied. Follow its progress under Applications.')
  })

/** Opens an application from the tracker where it was left. */
export const openApplication = (id: string) =>
  action(async () => {
    const application = await applicationsApi.get(id)
    const session = application.sessionId
      ? await workspaceApi.getSession(application.sessionId).catch(() => null)
      : null
    loadApplication(application, session)
    return true
  })

/** Imports a CV and chooses it for this application. */
export const importCv = () =>
  action(async () => {
    const cv = await documentsApi.import()
    if (!cv) return
    await refreshDashboard()
    selectResume(cv.id)
    notify(`Imported ${cv.name}`)
  })

/** Puts an imported job into the job description, keeping where it came from. */
function applyImportedJob(job: JobImport) {
  setJob(job.text)
  setLinked({
    url: job.url,
    role: job.title ?? '',
    company: job.company ?? '',
    location: job.location ?? '',
  })
  notify(
    job.fromPage
      ? 'Imported the page’s text. Check it and remove anything that isn’t part of the job.'
      : `Imported ${job.title ?? 'the job description'}. Check it before you analyze.`,
  )
}

/** Reads a job posting's link into the job description; resolves to true when it did. */
export const importJobLink = (link: string) =>
  busyAction(
    async () => {
      applyImportedJob(await workspaceApi.importJobLink(link))
      return true
    },
    { phase: 'Reading the job posting', files: 0, total: 0 },
  )

/** Opens the link last imported in its own window; resolves to true when it opened. */
export const openJobPage = () =>
  action(async () => {
    await workspaceApi.openJobPage()
    return true
  })

/** Reads the job from the posting window; resolves to true when it did. */
export const takeJobPage = () =>
  busyAction(async () => {
    applyImportedJob(await workspaceApi.useJobPage())
    return true
  })

export const closeJobPage = () => workspaceApi.closeJobPage().catch(showError)

/**
 * The local analysis: the selected projects, matched against the job description. The review
 * page shows its progress; a failure returns to the projects so they can be corrected.
 */
export const analyze = () =>
  busyAction(
    async () => {
      const { selected, job, resumeId, application } = useWorkspaceStore.getState()
      setStep('review')
      let session: Session
      try {
        session = await workspaceApi.analyze({ projectIds: selected, job, resumeId })
      } catch (error) {
        setStep('projects')
        throw error
      }
      setSession(session)
      if (application)
        setApplication(
          await applicationsApi.update({
            id: application.id,
            projectIds: selected,
            resumeId,
            sessionId: session.id,
            step: 'review',
          }),
        )
      await refreshDashboard()
    },
    { phase: 'Starting analysis', files: 0, total: 0 },
  )

export const reviewSuggestion = (
  sessionId: string,
  suggestion: Suggestion,
  text: string,
  status: Suggestion['status'],
) =>
  action(async () => {
    replaceSuggestion(sessionId, await workspaceApi.review({ id: suggestion.id, text, status }))
  })

/** Replaces the session's suggestions with AI drafts. */
export const generateDrafts = (
  session: Session,
  request: { provider: Provider; model: string; tokenBudget: number | null },
) =>
  busyAction(async () => {
    setSession(await workspaceApi.generate({ sessionId: session.id, consent: true, ...request }))
  })

export const copyApproved = (approved: Suggestion[]) =>
  action(async () => {
    await workspaceApi.copy(approved.map((s) => '• ' + s.text).join('\n'))
    notify('Approved bullets copied.')
  })

export const exportSession = (sessionId: string, format: 'pdf' | 'docx') =>
  action(async () => {
    const path = await workspaceApi.exportResume(sessionId, format)
    if (path) notify(`Resume exported to ${path}`)
  })

/** Loads a saved session back into the workspace; resolves to true when it opened. */
export const openSession = (id: string) =>
  action(async () => {
    resumeSession(await workspaceApi.getSession(id))
    return true
  })

export const deleteSession = (id: string) =>
  action(async () => {
    await workspaceApi.deleteSession(id)
    forgetSession(id)
    await refreshDashboard()
  })
