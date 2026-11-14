import { Chip, Meter, Typography } from '@heroui/react'
import type { Session } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'

/** The keyword coverage of the approved bullets, each requirement, and what the scan read. */
export default function CoverageSummary({
  session,
  matched,
  score,
}: {
  session: Session
  matched: string[]
  score: number
}) {
  return (
    <section className="review-overview" aria-label="Application coverage">
      <div className="review-summary">
        <div>
          <span className="coverage-label">Approved skill coverage</span>
          <div className="coverage">
            <strong>{score}%</strong>
            <span>
              {matched.length} of {session.requirements.length} skills in approved bullets
            </span>
          </div>
        </div>
        <Meter aria-label="Approved skill coverage" value={score} size="sm">
          <Meter.Track>
            <Meter.Fill />
          </Meter.Track>
        </Meter>
        <Typography.Paragraph size="sm">
          Counts approved bullets that cite a detected skill. It is not an employer ATS score.
        </Typography.Paragraph>
      </div>
      <div className="requirement-summary">
        <span className="coverage-label">Technical skills detected in the job</span>
        <div className="requirements">
          {session.requirements.map((r) => (
            <Chip
              key={r}
              size="sm"
              variant={matched.includes(r) ? 'soft' : 'tertiary'}
              color={matched.includes(r) ? 'success' : 'default'}
              className="skill-tag"
            >
              {matched.includes(r) && <Icon icon="lucide:check" width={12} />} {r}
            </Chip>
          ))}
        </div>
        <Typography.Paragraph size="sm" className="scan-summary">
          {session.stats.files} files · {session.stats.cached} cached ·{' '}
          {(session.stats.durationMs / 1000).toFixed(1)}s
          {session.stats.capped ? ' · Scan limit reached; coverage is partial' : ''}
        </Typography.Paragraph>
      </div>
    </section>
  )
}
