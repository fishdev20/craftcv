import { randomUUID } from 'node:crypto'
import type {
  Evidence,
  Project,
  Repository,
  ReviewRequest,
  ScanStats,
  Session,
  Suggestion,
} from '../../shared/contracts'
import { localSuggestions, validateClaim } from './evidence'

/** At most this much evidence is kept per analysis, shared across its repositories. */
const EVIDENCE_TOTAL = 600
const EVIDENCE_PER_REPOSITORY = 120
const NOT_IN_JOB = 'Requirement was not present in the job analysis.'

export const emptyStats = (): ScanStats => ({
  files: 0,
  bytes: 0,
  cached: 0,
  skipped: 0,
  capped: false,
  durationMs: 0,
})

export function addStats(total: ScanStats, next: ScanStats) {
  for (const key of ['files', 'bytes', 'cached', 'skipped', 'durationMs'] as const)
    total[key] += next[key]
  total.capped ||= next.capped
}

/**
 * The relevant part of one repository's scan: evidence for the requested skills only,
 * capped so the session stays bounded, and labelled with its repository and project.
 */
export function relevantEvidence(
  scanned: Evidence[],
  requested: string[],
  repository: Repository,
  projects: Project[],
  repositoryCount: number,
): Evidence[] {
  return scanned
    .filter((e) => e.skills.some((s) => requested.includes(s)))
    .slice(0, Math.min(EVIDENCE_PER_REPOSITORY, Math.floor(EVIDENCE_TOTAL / repositoryCount)))
    .map((e) => ({
      ...e,
      repositoryName: repository.name,
      projectName: projects.find((project) => project.id === repository.projectId)?.name,
    }))
}

/** Interleaves services so bounded previews and AI requests do not favour the first repository. */
export function interleaveByRepository(
  evidence: Evidence[],
  repositories: Repository[],
): Evidence[] {
  const groups = repositories.map((repo) =>
    evidence.filter((item) => item.repositoryId === repo.id),
  )
  return Array.from({ length: Math.max(0, ...groups.map((group) => group.length)) }, (_, index) =>
    groups.flatMap((group) => (group[index] ? [group[index]] : [])),
  ).flat()
}

/** A new session, with local suggestions drafted from its evidence. */
export function createSession(input: {
  job: string
  requirements: string[]
  evidence: Evidence[]
  stats: ScanStats
  resumeId: string | null
}): Session {
  const session: Session = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    job: input.job,
    requirements: input.requirements,
    evidence: input.evidence,
    suggestions: [],
    stats: input.stats,
    usage: null,
    resumeId: input.resumeId,
  }
  session.suggestions = localSuggestions(session.id, input.requirements, input.evidence)
  return session
}

/** AI-drafted bullets as pending suggestions, each checked against the evidence it cites. */
export function aiSuggestions(
  session: Session,
  bullets: { text: string; requirement: string; evidenceIds: string[] }[],
): Suggestion[] {
  return bullets.map((b) => ({
    id: randomUUID(),
    sessionId: session.id,
    text: b.text,
    requirement: b.requirement,
    evidenceIds: b.evidenceIds,
    warnings: [
      ...validateClaim(b.text, b.evidenceIds, session.evidence),
      ...(!session.requirements.includes(b.requirement) ? [NOT_IN_JOB] : []),
      'AI draft: verify every claim before approval.',
    ],
    status: 'pending',
  }))
}

/**
 * A reviewer's edit of a suggestion, re-checked against its evidence. Approval is refused
 * while any claim is unsupported.
 */
export function reviewSuggestion(
  previous: Suggestion,
  request: ReviewRequest,
  session: Session,
): Suggestion {
  const warnings = validateClaim(request.text, previous.evidenceIds, session.evidence)
  if (!session.requirements.includes(previous.requirement)) warnings.push(NOT_IN_JOB)
  if (request.status === 'approved' && warnings.length)
    throw new Error('Resolve unsupported claims before approving: ' + warnings.join(' '))
  return { ...previous, ...request, warnings }
}

export const approvedSuggestions = (session: Session) =>
  session.suggestions.filter((s) => s.status === 'approved')
