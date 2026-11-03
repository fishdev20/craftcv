import { z } from 'zod'
import { documentSchema, type DocumentNode } from './document'
import { JOB_MAX_LENGTH, JOB_MIN_LENGTH } from './job'
const providerSchema = z.enum(['openai', 'chatgpt', 'anthropic'])
export type Provider = z.infer<typeof providerSchema>
export const apiKeyProviderSchema = z.enum(['openai', 'anthropic'])
export type ApiKeyProvider = z.infer<typeof apiKeyProviderSchema>
/** Provider pages CraftCV may open in the browser, by name. */
export const externalPageSchema = z.enum([
  'openai-keys',
  'anthropic-keys',
  'chatgpt-plans',
  'chatgpt-usage',
])
export type ExternalPage = z.infer<typeof externalPageSchema>
const modelSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[\w./:-]+$/)
  .max(100)
const tokenBudgetSchema = z.number().int().min(1000).max(100000).nullable().default(null)
export const requestSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1).max(10),
  job: z.string().trim().min(JOB_MIN_LENGTH).max(JOB_MAX_LENGTH),
  resumeId: z.string().uuid().nullable(),
})
export type AnalyzeRequest = z.infer<typeof requestSchema>
export const jobLinkSchema = z.string().trim().min(1).max(2048)
/** A job description read from a link; `fromPage` means it is the page's text, to be checked. */
export type JobImport = {
  text: string
  title: string | null
  company: string | null
  location: string | null
  url: string
  fromPage: boolean
}

/** What a job is: entered by hand or read from its posting's link. */
const detailSchema = z.string().trim().max(200)
export const jobDetailsSchema = z.object({
  role: detailSchema,
  company: detailSchema,
  location: detailSchema,
  url: z.string().trim().max(2048).nullable(),
  description: z.string().trim().min(JOB_MIN_LENGTH).max(JOB_MAX_LENGTH),
  source: z.enum(['manual', 'link']),
})
export type JobDetails = z.infer<typeof jobDetailsSchema>

/** The job's requirements: what it must have, what is a plus, and the terms that recur. */
export type JobAnalysis = {
  mustHave: string[]
  niceToHave: string[]
  keywords: string[]
  responsibilities: string[]
  source: 'local' | 'ai'
  provider: Provider | null
  model: string | null
  analyzedAt: string
  usage: { input: number; output: number } | null
}

export const applicationStatusSchema = z.enum([
  'preparing',
  'applied',
  'interviewing',
  'offer',
  'closed',
])
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>
const applicationStepSchema = z.enum(['job', 'analysis', 'cv', 'projects', 'review'])
export type ApplicationStep = z.infer<typeof applicationStepSchema>

/** One job applied for: the wizard's saved progress, and the tracker's card. */
export type Application = {
  id: string
  createdAt: string
  updatedAt: string
  job: JobDetails
  analysis: JobAnalysis | null
  resumeId: string | null
  projectIds: string[]
  sessionId: string | null
  step: ApplicationStep
  status: ApplicationStatus
  history: { status: ApplicationStatus; at: string }[]
  appliedAt: string | null
  notes: string
}
export type ApplicationSummary = Pick<
  Application,
  'id' | 'createdAt' | 'updatedAt' | 'step' | 'status' | 'appliedAt' | 'resumeId' | 'sessionId'
> & { role: string; company: string; location: string; hasLink: boolean }

const listSchema = z.array(z.string().trim().min(1).max(100)).max(60)
export const updateApplicationSchema = z.object({
  id: z.string().uuid(),
  job: jobDetailsSchema.optional(),
  requirements: z
    .object({ mustHave: listSchema, niceToHave: listSchema, keywords: listSchema })
    .optional(),
  resumeId: z.string().uuid().nullable().optional(),
  projectIds: z.array(z.string().uuid()).max(10).optional(),
  sessionId: z.string().uuid().nullable().optional(),
  step: applicationStepSchema.optional(),
  notes: z.string().max(5000).optional(),
})
export type UpdateApplicationRequest = z.infer<typeof updateApplicationSchema>
export const applicationStatusRequestSchema = z.object({
  id: z.string().uuid(),
  status: applicationStatusSchema,
})
export const enrichJobSchema = z.object({
  id: z.string().uuid(),
  provider: providerSchema,
  model: modelSchema,
  consent: z.literal(true),
  tokenBudget: tokenBudgetSchema,
})
export type EnrichJobRequest = z.infer<typeof enrichJobSchema>
export const reviewSchema = z.object({
  id: z.string().uuid(),
  text: z.string().trim().min(1).max(1500),
  status: z.enum(['pending', 'approved', 'rejected']),
})
export type ReviewRequest = z.infer<typeof reviewSchema>
export const generateSchema = z.object({
  sessionId: z.string().uuid(),
  provider: providerSchema,
  model: modelSchema,
  consent: z.literal(true),
  tokenBudget: tokenBudgetSchema,
})
export type GenerateRequest = z.infer<typeof generateSchema>
export type FolderImport = {
  folder: string
  project: Project
  repositories: Repository[]
  added: number
  skipped: number
  limited: boolean
  unreadable: number
}
export type Repository = { id: string; name: string; path: string; projectId: string }
export type ProjectAnalysis = {
  summary: string
  architecture: string
  technologies: string[]
  services: { name: string; purpose: string; evidencePaths: string[] }[]
  integrations: string[]
  unknowns: string[]
  provider: Provider
  model: string
  analyzedAt: string
  usage: { input: number; output: number } | null
}
export type Project = {
  id: string
  name: string
  rootPath: string
  repositories: Repository[]
  analysis: ProjectAnalysis | null
}
export const analyzeProjectSchema = z.object({
  projectId: z.string().uuid(),
  provider: providerSchema,
  model: modelSchema,
  consent: z.literal(true),
  tokenBudget: tokenBudgetSchema,
})
export type AnalyzeProjectRequest = z.infer<typeof analyzeProjectSchema>
export type Resume = {
  id: string
  name: string
  text: string
  document: DocumentNode
  revision: number
  updatedAt: string | null
}
export const saveResumeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  document: documentSchema,
  revision: z.number().int().min(0),
})
export type SaveResumeRequest = z.infer<typeof saveResumeSchema>
export type Evidence = {
  id: string
  repositoryId: string
  repositoryName?: string
  projectName?: string
  path: string
  line: number
  snippet: string
  skills: string[]
  hash: string
}
export type Suggestion = {
  id: string
  sessionId: string
  text: string
  evidenceIds: string[]
  requirement: string
  warnings: string[]
  status: 'pending' | 'approved' | 'rejected'
}
export type ScanStats = {
  files: number
  bytes: number
  cached: number
  skipped: number
  capped: boolean
  durationMs: number
}
export type Session = {
  id: string
  createdAt: string
  job: string
  requirements: string[]
  evidence: Evidence[]
  suggestions: Suggestion[]
  stats: ScanStats
  usage: { input: number; output: number } | null
  resumeId: string | null
}
export type Progress = { phase: string; files: number; total: number }
/** What the AI has read from the job so far; every field fills in as the reply streams. */
export type JobAnalysisDraft = {
  role?: string
  company?: string
  location?: string
  mustHave?: string[]
  niceToHave?: string[]
  keywords?: string[]
  responsibilities?: string[]
}
/**
 * One moment of an AI job analysis, as it runs: the stage it reached, what has streamed in,
 * and at the end the terms dropped because the job's text never names them.
 */
export type JobAnalysisEvent = {
  applicationId: string
  stage: 'access' | 'send' | 'stream' | 'check' | 'done' | 'failed'
  draft?: JobAnalysisDraft
  dropped?: string[]
  error?: string
}
export type Dashboard = {
  projects: Project[]
  repositories: Repository[]
  resumes: Pick<Resume, 'id' | 'name'>[]
  sessions: { id: string; createdAt: string; title: string }[]
  applications: ApplicationSummary[]
  keys: Record<Provider, boolean>
  chatgpt: {
    connected: boolean
    email: string | null
    models: { slug: string; displayName: string }[]
  }
}
/** A failure may name provider pages where the person can fix it. */
export type Result<T> =
  { ok: true; value: T } | { ok: false; error: string; pages?: ExternalPage[] }
export interface CraftAPI {
  getRuntimeInfo(): Promise<Result<{ bridgeVersion: number }>>
  dashboard(): Promise<Result<Dashboard>>
  selectRepository(): Promise<Result<FolderImport | null>>
  importRepositoryFolder(): Promise<Result<FolderImport | null>>
  removeRepository(id: string): Promise<Result<void>>
  removeProject(id: string): Promise<Result<void>>
  analyzeProject(request: AnalyzeProjectRequest): Promise<Result<Project>>
  importResume(): Promise<Result<Resume | null>>
  getResume(id: string): Promise<Result<Resume>>
  createResume(sessionId: string | null): Promise<Result<Resume>>
  saveResume(request: SaveResumeRequest): Promise<Result<Resume>>
  exportDocument(id: string, format: 'pdf' | 'docx'): Promise<Result<string | null>>
  deleteResume(id: string): Promise<Result<void>>
  analyze(request: AnalyzeRequest): Promise<Result<Session>>
  cancel(): Promise<Result<void>>
  getSession(id: string): Promise<Result<Session>>
  deleteSession(id: string): Promise<Result<void>>
  /** Reads the job description from a job posting's link, in the main process. */
  importJobLink(link: string): Promise<Result<JobImport>>
  /** Opens the link last imported in a window of its own, for sites that block CraftCV. */
  openJobPage(): Promise<Result<void>>
  /** Reads the job from the page open in that window, and closes it. */
  useJobPage(): Promise<Result<JobImport>>
  closeJobPage(): Promise<Result<void>>
  /** Starts an application from its job, analysing the job's requirements locally. */
  createApplication(job: JobDetails): Promise<Result<Application>>
  getApplication(id: string): Promise<Result<Application>>
  updateApplication(request: UpdateApplicationRequest): Promise<Result<Application>>
  setApplicationStatus(id: string, status: ApplicationStatus): Promise<Result<Application>>
  deleteApplication(id: string): Promise<Result<void>>
  /** Asks a provider for the job's requirements, with the person's consent. */
  enrichJob(request: EnrichJobRequest): Promise<Result<Application>>
  /** Opens the application's job posting in the browser; its link is never sent from here. */
  openApplicationLink(id: string): Promise<Result<void>>
  generate(request: GenerateRequest): Promise<Result<Session>>
  review(request: ReviewRequest): Promise<Result<Suggestion>>
  saveKey(provider: ApiKeyProvider, key: string): Promise<Result<void>>
  connectChatGPT(): Promise<Result<void>>
  disconnectChatGPT(): Promise<Result<void>>
  refreshChatGPTModels(): Promise<Result<void>>
  exportResume(sessionId: string, format: 'pdf' | 'docx'): Promise<Result<string | null>>
  copy(text: string): Promise<Result<void>>
  /** Opens one of a provider's own pages in the system browser. */
  openPage(page: ExternalPage): Promise<Result<void>>
  onProgress(callback: (progress: Progress) => void): () => void
  /** Each step of an AI job analysis while it runs, with what has streamed in so far. */
  onJobAnalysis(callback: (event: JobAnalysisEvent) => void): () => void
}
