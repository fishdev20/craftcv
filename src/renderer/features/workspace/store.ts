import { create } from 'zustand'
import type { Application, ApplicationStep, Session, Suggestion } from '@shared/contracts'

export const MAX_SELECTED_PROJECTS = 10

/** The steps of a new application, in order; each is its own page. */
export const STEPS: ApplicationStep[] = ['job', 'analysis', 'cv', 'projects', 'review']

/** Where an imported link's job came from, kept until the application is created. */
type LinkedJob = { url: string; role: string; company: string; location: string }

interface WorkspaceState {
  /** The job description being tailored for. */
  job: string
  /** The posting the job was imported from, if it was. */
  linked: LinkedJob | null
  /** The projects chosen as evidence, at most MAX_SELECTED_PROJECTS. */
  selected: string[]
  /** The master CV the application starts from. */
  resumeId: string | null
  /** The analysis under review. */
  session: Session | null
  /** The application being prepared; created once the job is entered. */
  application: Application | null
  /** Which step's page is showing. */
  step: ApplicationStep
}

const fresh = (): WorkspaceState => ({
  job: '',
  linked: null,
  selected: [],
  resumeId: null,
  session: null,
  application: null,
  step: 'job',
})

export const useWorkspaceStore = create<WorkspaceState>(fresh)

const set = useWorkspaceStore.setState
const get = useWorkspaceStore.getState

export const setJob = (job: string) => set({ job })
export const setLinked = (linked: LinkedJob | null) => set({ linked })
export const selectResume = (resumeId: string | null) => set({ resumeId })
export const setSession = (session: Session | null) => set({ session })
export const setStep = (step: ApplicationStep) => set({ step })
export const setApplication = (application: Application | null) => set({ application })

/** Clears everything for a new application. */
export const startOver = () => set(fresh())

/** Opens an application where it was left, with the session it produced if it still exists. */
export function loadApplication(application: Application, session: Session | null) {
  set({
    ...fresh(),
    application,
    job: application.job.description,
    resumeId: application.resumeId,
    selected: application.projectIds,
    session,
    step: application.step === 'review' && !session ? 'projects' : application.step,
  })
}

export function toggleProject(id: string, on: boolean) {
  const { selected } = get()
  set({ selected: on ? [...selected, id] : selected.filter((item) => item !== id) })
}

export function addSelectedProject(id: string) {
  set({ selected: [...new Set([...get().selected, id])].slice(0, MAX_SELECTED_PROJECTS) })
}

/** Opens a saved session, with the job and CV it was made from. */
export function resumeSession(session: Session) {
  set({ ...fresh(), session, job: session.job, resumeId: session.resumeId, step: 'review' })
}

export function replaceSuggestion(sessionId: string, updated: Suggestion) {
  const { session } = get()
  if (session?.id !== sessionId) return
  set({
    session: {
      ...session,
      suggestions: session.suggestions.map((s) => (s.id === updated.id ? updated : s)),
    },
  })
}

/** Drops references to things removed elsewhere in the app. */
export function forgetProject(id: string) {
  set({ selected: get().selected.filter((item) => item !== id) })
}
export function forgetResume(id: string) {
  if (get().resumeId === id) set({ resumeId: null })
}
export function forgetSession(id: string) {
  const { session, step } = get()
  if (session?.id === id) set({ session: null, step: step === 'review' ? 'projects' : step })
}
export function forgetApplication(id: string) {
  if (get().application?.id === id) set(fresh())
}
