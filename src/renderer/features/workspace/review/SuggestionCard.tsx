import { useState } from 'react'
import { Button, Chip, Disclosure, Spinner, TextArea, TextField, Typography } from '@heroui/react'
import type { Session, Suggestion } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import { reviewSuggestion } from '../actions'
import EvidenceSnippet from './EvidenceSnippet'

const statusColor = { approved: 'success', rejected: 'danger', pending: 'default' } as const

/** One suggested bullet: editable, with its evidence, and approve, save or reject. */
export default function SuggestionCard({
  suggestion,
  session,
}: {
  suggestion: Suggestion
  session: Session
}) {
  const [text, setText] = useState(suggestion.text),
    [saving, setSaving] = useState<Suggestion['status'] | null>(null)
  const update = async (status: Suggestion['status']) => {
    setSaving(status)
    try {
      await reviewSuggestion(session.id, suggestion, text, status)
    } finally {
      setSaving(null)
    }
  }
  return (
    <article className={`suggestion ${suggestion.status}`}>
      <div className="suggestion-heading">
        <Chip size="sm" variant="tertiary" className="skill-tag">
          {suggestion.requirement}
        </Chip>
        <Chip
          size="sm"
          variant="soft"
          color={statusColor[suggestion.status]}
          className="status-label"
        >
          {suggestion.status === 'approved' ? <Icon icon="lucide:check" width={14} /> : null}
          {suggestion.status}
        </Chip>
      </div>
      <TextField
        aria-label={`Edit ${suggestion.requirement} bullet`}
        value={text}
        onChange={setText}
        maxLength={1500}
        fullWidth
      >
        <TextArea rows={3} />
      </TextField>
      {suggestion.warnings.length > 0 && (
        <Typography.Paragraph size="sm" className="claim-note">
          {suggestion.warnings.join(' ')}
        </Typography.Paragraph>
      )}
      <Disclosure className="evidence-disclosure">
        <Disclosure.Heading>
          <Disclosure.Trigger>
            <Icon icon="lucide:code-xml" width={14} />
            Supporting evidence
            <Disclosure.Indicator />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        <Disclosure.Content>
          <Disclosure.Body>
            {suggestion.evidenceIds.map((id) => {
              const e = session.evidence.find((e) => e.id === id)
              return e ? (
                <EvidenceSnippet key={id} evidence={e} />
              ) : (
                <Typography.Paragraph size="sm" key={id}>
                  Source reference unavailable.
                </Typography.Paragraph>
              )
            })}
          </Disclosure.Body>
        </Disclosure.Content>
      </Disclosure>
      <div className="suggestion-actions">
        <Button
          size="sm"
          variant="outline"
          isPending={saving === 'approved'}
          isDisabled={saving !== null}
          onClick={() => void update('approved')}
        >
          {saving === 'approved' ? (
            <Spinner aria-hidden="true" size="sm" color="current" />
          ) : (
            <Icon icon="lucide:check" width={14} />
          )}
          {saving === 'approved' ? 'Approving…' : 'Approve'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          isPending={saving === 'pending'}
          isDisabled={saving !== null}
          onClick={() => void update('pending')}
        >
          {saving === 'pending' && <Spinner aria-hidden="true" size="sm" color="current" />}
          {saving === 'pending' ? 'Saving…' : 'Save draft'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          isPending={saving === 'rejected'}
          isDisabled={saving !== null}
          onClick={() => void update('rejected')}
        >
          {saving === 'rejected' && <Spinner aria-hidden="true" size="sm" color="current" />}
          {saving === 'rejected' ? 'Rejecting…' : 'Reject'}
        </Button>
      </div>
    </article>
  )
}
