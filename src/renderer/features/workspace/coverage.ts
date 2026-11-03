import type { Session } from '@shared/contracts'

/**
 * How much of the job the approved bullets cover: a requirement counts once an approved
 * bullet for it cites evidence that shows that skill. Keyword coverage, not an ATS score.
 */
export function coverage(session: Session) {
  const approved = session.suggestions.filter((s) => s.status === 'approved')
  const matched = session.requirements.filter((requirement) =>
    approved.some(
      (s) =>
        s.requirement === requirement &&
        s.evidenceIds.some((id) =>
          session.evidence.some((e) => e.id === id && e.skills.includes(requirement)),
        ),
    ),
  )
  const score = session.requirements.length
    ? Math.round((matched.length / session.requirements.length) * 100)
    : 0
  return { approved, matched, score }
}
