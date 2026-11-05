import { useState } from 'react'
import { Button, Disclosure, Input, Label, TextField, Typography } from '@heroui/react'
import type { Session } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import ActionIcon from '@/common/ui/ActionIcon'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { useAppStore } from '@/common/store/app-store'
import ConnectProviderNote from '@/features/ai/ConnectProviderNote'
import ConsentCheckbox from '@/features/ai/ConsentCheckbox'
import ProviderModelFields from '@/features/ai/ProviderModelFields'
import { providerName } from '@/features/ai/providers'
import { useProviderChoice } from '@/features/ai/useProviderChoice'
import { generateDrafts } from '../actions'
import EvidenceSnippet from './EvidenceSnippet'

/** One consented cloud request that replaces the session's suggestions with AI drafts. */
export default function CloudRefinePanel({ session }: { session: Session }) {
  const busy = useAppStore((s) => s.busy)
  const choice = useProviderChoice()
  const [budget, setBudget] = useState('')
  const { pending, run } = usePendingAction()
  const canGenerate =
    choice.consent &&
    choice.connected &&
    !busy &&
    !session.usage &&
    session.evidence.length > 0 &&
    !!choice.model
  return (
    <Disclosure className="cloud-panel">
      <Disclosure.Heading>
        <Disclosure.Trigger>
          <Icon icon="lucide:sparkles" width={16} />
          Refine with cloud AI
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body>
          <Typography.Paragraph size="sm">
            One request shares the job description (up to 12,000 characters), CV text (up to
            10,000), and up to 24 relevant source snippets (1,200 characters each), including file
            paths. Review the sources before sharing. AI drafts replace this session’s current
            suggestions.
          </Typography.Paragraph>
          <ProviderModelFields choice={choice} />
          <TextField value={budget} onChange={setBudget} type="number" className="budget-field">
            <Label>Optional session token budget</Label>
            <Input min={1000} max={100000} placeholder="No budget set" />
          </TextField>
          <Disclosure className="payload-preview">
            <Disclosure.Heading>
              <Disclosure.Trigger>
                Preview source snippets to be shared
                <Disclosure.Indicator />
              </Disclosure.Trigger>
            </Disclosure.Heading>
            <Disclosure.Content>
              <Disclosure.Body>
                {session.evidence.slice(0, 24).map((e) => (
                  <EvidenceSnippet key={e.id} evidence={e} />
                ))}
              </Disclosure.Body>
            </Disclosure.Content>
          </Disclosure>
          <ConsentCheckbox isSelected={choice.consent} onChange={choice.setConsent}>
            I consent to sending this session’s CV, job text, and source snippets to{' '}
            {providerName(choice.provider)}.
          </ConsentCheckbox>
          {!choice.connected && <ConnectProviderNote />}
          <Button
            isPending={pending === 'generate'}
            isDisabled={!canGenerate}
            onClick={() =>
              void run('generate', () =>
                generateDrafts(session, {
                  provider: choice.provider,
                  model: choice.model,
                  tokenBudget: budget ? Number(budget) : null,
                }),
              )
            }
          >
            <ActionIcon pending={pending === 'generate'} icon="lucide:sparkles" />
            {pending === 'generate' ? 'Generating drafts…' : 'Generate AI drafts'}
          </Button>
          {session.usage && (
            <Typography.Paragraph size="sm">
              Tokens reported: {session.usage.input} input, {session.usage.output} output. Start a
              new analysis for another AI request.
            </Typography.Paragraph>
          )}
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  )
}
