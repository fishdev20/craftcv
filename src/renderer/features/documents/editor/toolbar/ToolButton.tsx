import { Button, ToggleButton, Tooltip } from '@heroui/react'
import { Icon } from '@/common/ui/icons'

/**
 * An icon tool with a tooltip. With `pressed` it is a toggle (bold, alignment); without it,
 * a plain action (undo, insert table). Neither takes focus from the document.
 */
export default function ToolButton({
  label,
  icon,
  run,
  pressed,
  disabled = false,
}: {
  label: string
  icon: string
  run: () => void
  pressed?: boolean
  disabled?: boolean
}) {
  const glyph = <Icon icon={icon} width={16} />
  return (
    <Tooltip delay={600} closeDelay={0}>
      {pressed === undefined ? (
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="editor-tool"
          aria-label={label}
          isDisabled={disabled}
          preventFocusOnPress
          onClick={run}
        >
          {glyph}
        </Button>
      ) : (
        <ToggleButton
          isIconOnly
          size="sm"
          variant="ghost"
          className="editor-tool"
          aria-label={label}
          isSelected={pressed}
          isDisabled={disabled}
          preventFocusOnPress
          onChange={run}
        >
          {glyph}
        </ToggleButton>
      )}
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  )
}
