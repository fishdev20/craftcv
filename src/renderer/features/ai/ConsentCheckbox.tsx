import type { ReactNode } from 'react'
import { Checkbox, Label } from '@heroui/react'

export default function ConsentCheckbox({
  isSelected,
  onChange,
  isDisabled,
  children,
}: {
  isSelected: boolean
  onChange: (selected: boolean) => void
  isDisabled?: boolean
  children: ReactNode
}) {
  return (
    <Checkbox
      className="consent-checkbox"
      isSelected={isSelected}
      onChange={onChange}
      isDisabled={isDisabled}
    >
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Label>{children}</Label>
      </Checkbox.Content>
    </Checkbox>
  )
}
