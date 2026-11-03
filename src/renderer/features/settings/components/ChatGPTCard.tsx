import { Button, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import { useAppStore } from '@/common/store/app-store'
import { chatgptAction } from '../actions'
import ProviderCard, { Status } from './ProviderCard'

/** A ChatGPT plan, connected by signing in through the browser. */
export default function ChatGPTCard() {
  const account = useAppStore((state) => state.dashboard?.chatgpt)
  const busy = useAppStore((state) => state.busy)
  return (
    <ProviderCard
      logo="simple-icons:openai"
      name="ChatGPT plan"
      kind="Sign in with your account"
      status={
        <Status on={!!account?.connected}>{account?.connected ? 'Connected' : 'Not set up'}</Status>
      }
    >
      <Typography.Paragraph size="sm" className="provider-about">
        Use an eligible ChatGPT plan for CraftCV’s OpenAI requests. Sign-in opens in your browser;
        CraftCV never reads Codex credential files or ChatGPT conversations.
      </Typography.Paragraph>
      {account?.connected ? (
        <>
          <dl className="provider-account">
            <div>
              <dt>Account</dt>
              <dd>{account.email ?? 'ChatGPT account'}</dd>
            </div>
            <div>
              <dt>Models</dt>
              <dd>
                {account.models.length} available
                {account.models.length > 0 && (
                  <span className="provider-models">
                    {account.models
                      .slice(0, 3)
                      .map((model) => model.displayName)
                      .join(', ')}
                    {account.models.length > 3 ? `, +${account.models.length - 3}` : ''}
                  </span>
                )}
              </dd>
            </div>
          </dl>
          <div className="provider-actions">
            <Button
              size="sm"
              variant="outline"
              isDisabled={busy}
              onClick={() => void chatgptAction('models')}
            >
              <Icon icon="lucide:refresh-cw" width={14} />
              Refresh models
            </Button>
            <Button
              size="sm"
              variant="ghost"
              isDisabled={busy}
              onClick={() => void chatgptAction('disconnect')}
            >
              <Icon icon="lucide:unplug" width={14} />
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <div className="provider-actions">
          <Button size="sm" isDisabled={busy} onClick={() => void chatgptAction('connect')}>
            <Icon icon="lucide:log-in" width={15} />
            Continue with ChatGPT
          </Button>
        </div>
      )}
    </ProviderCard>
  )
}
