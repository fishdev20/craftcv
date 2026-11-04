import type { Editor } from '@tiptap/react'
import { Button, Dropdown, Tooltip } from '@heroui/react'
import { Icon } from '@/common/ui/icons'

/** Soft fills that keep dark text readable on screen and in print. */
const COLORS = [
  { id: '#fff3a3', label: 'Yellow' },
  { id: '#d6f5d6', label: 'Green' },
  { id: '#d6ecff', label: 'Blue' },
  { id: '#fde2ef', label: 'Pink' },
  { id: '#ffe3c2', label: 'Orange' },
]

/** Highlights the selection with one of a few fills, or removes the highlight. */
export default function HighlightMenu({
  editor,
  current,
}: {
  editor: Editor
  current: string | null
}) {
  return (
    <Dropdown>
      <Tooltip delay={600} closeDelay={0}>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          className="editor-tool highlight-tool"
          aria-label="Highlight"
          preventFocusOnPress
        >
          <Icon icon="lucide:highlighter" width={16} />
          <span className="highlight-tool-bar" style={{ background: current ?? 'transparent' }} />
        </Button>
        <Tooltip.Content>Highlight</Tooltip.Content>
      </Tooltip>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu
          aria-label="Highlight colour"
          onAction={(key) => {
            const chain = editor.chain().focus()
            if (key === 'none') chain.unsetBackgroundColor().run()
            else chain.setBackgroundColor(String(key)).run()
            // the menu hands focus back to its button as it closes; typing belongs in the page
            requestAnimationFrame(() => editor.commands.focus())
          }}
        >
          {[
            ...COLORS.map((color) => (
              <Dropdown.Item key={color.id} id={color.id} textValue={color.label}>
                <span className="highlight-swatch" style={{ background: color.id }} />
                {color.label}
              </Dropdown.Item>
            )),
            <Dropdown.Item key="none" id="none" textValue="No highlight">
              <span className="highlight-swatch highlight-swatch--none" />
              No highlight
            </Dropdown.Item>,
          ]}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
