import { EmptyState, Typography } from '@heroui/react'
import type { Session } from '@shared/contracts'
import { coverage } from '../coverage'
import CloudRefinePanel from './CloudRefinePanel'
import CoverageSummary from './CoverageSummary'
import ExportActions from './ExportActions'
import SuggestionCard from './SuggestionCard'

export default function SessionReview({ session }: { session: Session }) {
  const { approved, matched, score } = coverage(session)
  return (
    <div className="review-content">
      <CoverageSummary session={session} matched={matched} score={score} />
      {session.suggestions.length === 0 ? (
        <EmptyState className="empty-small">
          No matching evidence found. Choose another repository or revise the job description.
        </EmptyState>
      ) : (
        <section className="suggestions-section" aria-labelledby="suggestions-heading">
          <div className="suggestions-heading">
            <div>
              <Typography.Heading level={3} id="suggestions-heading">
                Suggested experience bullets
              </Typography.Heading>
              <Typography.Paragraph size="sm">
                Edit the wording, inspect its evidence, then approve only what you can support.
              </Typography.Paragraph>
            </div>
            <span>{session.suggestions.length}</span>
          </div>
          <div className="suggestion-list">
            {session.suggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} session={session} />
            ))}
          </div>
        </section>
      )}
      <CloudRefinePanel session={session} />
      <ExportActions session={session} approved={approved} />
    </div>
  )
}
