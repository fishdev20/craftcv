import type { Editor } from '@tiptap/react'
import { Button, Dropdown, Tooltip } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import { insertEntryLine } from '../extensions'

const ITEMS = [
  {
    id: 'entry',
    icon: 'lucide:align-horizontal-space-between',
    label: 'Dated line',
    help: 'Text on the left, dates flush right',
  },
  { id: 'table', icon: 'lucide:table-2', label: 'Table', help: 'Three rows, two columns' },
  { id: 'rule', icon: 'lucide:minus', label: 'Horizontal rule', help: 'A line across the page' },
  {
    id: 'break',
    icon: 'lucide:scissors-line-dashed',
    label: 'Page break',
    help: 'Start a new page here',
  },
] as const

/** Blocks to add at the cursor. */
export default function InsertMenu({ editor }: { editor: Editor }) {
  const insert = (id: string) => {
    const chain = editor.chain().focus()
    if (id === 'entry') insertEntryLine(editor)
    else if (id === 'table') chain.insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()
    else if (id === 'rule') chain.setHorizontalRule().run()
    else if (id === 'break') chain.insertContent({ type: 'pageBreak' }).run()
    // the menu hands focus back to its button as it closes; typing belongs in the page
    requestAnimationFrame(() => editor.commands.focus())
  }
  return (
    <Dropdown>
      <Tooltip delay={600} closeDelay={0}>
        <Button size="sm" variant="ghost" className="editor-tool insert-tool" preventFocusOnPress>
          <Icon icon="lucide:plus" width={15} />
          Insert
          <Icon icon="lucide:chevron-down" width={13} />
        </Button>
        <Tooltip.Content>Insert a dated line, table, rule or page break</Tooltip.Content>
      </Tooltip>
      <Dropdown.Popover placement="bottom start">
        <Dropdown.Menu aria-label="Insert" onAction={(key) => insert(String(key))}>
          {ITEMS.map((item) => (
            <Dropdown.Item key={item.id} id={item.id} textValue={item.label}>
              <Icon icon={item.icon} width={15} />
              <span className="insert-item">
                <span>{item.label}</span>
                <small>{item.help}</small>
              </span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  )
}
