import type { Editor } from '@tiptap/react'
import { Button, Toolbar } from '@heroui/react'

const actions: [string, (editor: Editor) => void][] = [
  ['Add row', (e) => e.chain().focus().addRowAfter().run()],
  ['Add column', (e) => e.chain().focus().addColumnAfter().run()],
  ['Delete row', (e) => e.chain().focus().deleteRow().run()],
  ['Delete column', (e) => e.chain().focus().deleteColumn().run()],
  ['Merge cells', (e) => e.chain().focus().mergeCells().run()],
  ['Split cell', (e) => e.chain().focus().splitCell().run()],
  ['Delete table', (e) => e.chain().focus().deleteTable().run()],
]

/** Row, column and cell tools, shown while the selection is in a table. */
export default function TableActions({ editor }: { editor: Editor }) {
  return (
    <Toolbar className="table-actions" aria-label="Table editing">
      {actions.map(([label, run]) => (
        <Button
          key={label}
          variant="ghost"
          size="sm"
          preventFocusOnPress
          onClick={() => run(editor)}
        >
          {label}
        </Button>
      ))}
    </Toolbar>
  )
}
