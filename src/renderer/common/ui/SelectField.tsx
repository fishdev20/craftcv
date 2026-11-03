import type { Key } from 'react'
import { Label, ListBox, Select } from '@heroui/react'

type SelectOption = { id: string; label: string }

/** A HeroUI select over a flat list of string options. */
export default function SelectField({
  label,
  hideLabel = false,
  options,
  value,
  onChange,
  isDisabled,
  className,
}: {
  label: string
  hideLabel?: boolean
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  isDisabled?: boolean
  className?: string
}) {
  return (
    <Select
      className={className}
      value={value}
      onChange={(key: Key | null) => {
        if (key !== null) onChange(String(key))
      }}
      isDisabled={isDisabled}
      aria-label={hideLabel ? label : undefined}
    >
      {!hideLabel && <Label>{label}</Label>}
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.id} id={option.id} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  )
}
