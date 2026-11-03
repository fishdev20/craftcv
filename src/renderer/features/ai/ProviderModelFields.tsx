import { Input, Label, TextField } from '@heroui/react'
import type { Provider } from '@shared/contracts'
import SelectField from '@/common/ui/SelectField'
import { providerOptions } from './providers'
import type { ProviderChoice } from './useProviderChoice'

/** The provider select and the model select (ChatGPT plan) or free-text model field. */
export default function ProviderModelFields({
  choice,
  isDisabled,
}: {
  choice: ProviderChoice
  isDisabled?: boolean
}) {
  const { provider, model, chatgptModels, setProvider, setModel } = choice
  return (
    <div className="field-grid">
      <SelectField
        label="Provider"
        options={providerOptions}
        value={provider}
        isDisabled={isDisabled}
        onChange={(next) => setProvider(next as Provider)}
      />
      {provider === 'chatgpt' && chatgptModels.length ? (
        <SelectField
          label="Model"
          options={chatgptModels.map((item) => ({ id: item.slug, label: item.displayName }))}
          value={model}
          isDisabled={isDisabled}
          onChange={setModel}
        />
      ) : (
        <TextField value={model} onChange={setModel} isDisabled={isDisabled} maxLength={100}>
          <Label>Model</Label>
          <Input />
        </TextField>
      )}
    </div>
  )
}
