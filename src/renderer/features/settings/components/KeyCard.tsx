import { useState } from 'react'
import { Button, InputGroup, Label, Link, TextField, Typography } from '@heroui/react'
import type { ApiKeyProvider } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import { openPage, useAppStore } from '@/common/store/app-store'
import { saveKey } from '../actions'
import ProviderCard, { Status } from './ProviderCard'

const keyProviders: Record<
  ApiKeyProvider,
  { name: string; logo: string; about: string; billing?: string }
> = {
  openai: {
    name: 'OpenAI',
    logo: 'simple-icons:openai',
    about: 'Bill requests to your OpenAI API account with a pay-as-you-go key.',
  },
  anthropic: {
    name: 'Anthropic',
    logo: 'simple-icons:anthropic',
    about: 'Use Claude models with an API key from the Claude Console.',
    billing:
      'A Claude Pro or Max plan doesn’t include API use. The Console bills API requests separately, so add credit there before you create a key.',
  },
}

/** An API-key provider: paste, show, save, replace or remove its key. */
export default function KeyCard({ provider }: { provider: ApiKeyProvider }) {
  const [key, setKey] = useState(''),
    [visible, setVisible] = useState(false),
    [saving, setSaving] = useState(false),
    exists = useAppStore((s) => s.dashboard?.keys[provider])
  const { name, logo, about, billing } = keyProviders[provider]
  const save = async (value: string) => {
    setSaving(true)
    if (await saveKey(provider, value)) setKey('')
    setSaving(false)
  }
  return (
    <ProviderCard
      logo={logo}
      name={name}
      kind="API key"
      status={<Status on={!!exists}>{exists ? 'Key saved' : 'Not set up'}</Status>}
    >
      <Typography.Paragraph size="sm" className="provider-about">
        {about}
      </Typography.Paragraph>
      {billing && (
        <Typography.Paragraph size="sm" className="provider-note">
          <Icon icon="lucide:info" width={14} />
          <span>{billing}</span>
        </Typography.Paragraph>
      )}
      <Link className="provider-link" onPress={() => void openPage(`${provider}-keys`)}>
        Get an API key
        <Link.Icon />
      </Link>
      <form
        className="provider-key-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (key.trim()) void save(key)
        }}
      >
        <TextField
          type={visible ? 'text' : 'password'}
          autoComplete="off"
          value={key}
          onChange={setKey}
          fullWidth
        >
          <Label>{exists ? 'Replace API key' : 'API key'}</Label>
          <InputGroup fullWidth>
            <InputGroup.Prefix>
              <Icon icon="lucide:key-round" width={15} />
            </InputGroup.Prefix>
            <InputGroup.Input
              spellCheck={false}
              placeholder={exists ? 'Paste a new key to replace it' : 'Paste your API key'}
            />
            <InputGroup.Suffix>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label={visible ? 'Hide key' : 'Show key'}
                onClick={() => setVisible((value) => !value)}
              >
                <Icon icon={visible ? 'lucide:eye-off' : 'lucide:eye'} width={15} />
              </Button>
            </InputGroup.Suffix>
          </InputGroup>
        </TextField>
        <div className="provider-actions">
          <Button type="submit" size="sm" isDisabled={!key.trim() || saving}>
            Save key
          </Button>
          {exists && (
            <Button size="sm" variant="ghost" isDisabled={saving} onClick={() => void save('')}>
              <Icon icon="lucide:trash-2" width={14} />
              Remove key
            </Button>
          )}
        </div>
      </form>
    </ProviderCard>
  )
}
