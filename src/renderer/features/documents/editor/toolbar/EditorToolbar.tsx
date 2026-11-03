import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Separator, Toolbar } from '@heroui/react'
import LinkForm from './LinkForm'
import TableActions from './TableActions'
import TextStyleSelects from './TextStyleSelects'
import ToolButton from './ToolButton'
import { useToolbarState } from './useToolbarState'

const alignments = ['left', 'center', 'right', 'justify'] as const

/** The formatting toolbar, and the link and table bars it opens below itself. */
export default function EditorToolbar({ editor }: { editor: Editor }) {
  const state = useToolbarState(editor)
  const [linkHref, setLinkHref] = useState<string | null>(null)
  const chain = () => editor.chain().focus()
  return (
    <>
      <Toolbar className="editor-toolbar" aria-label="Document formatting">
        <ToolButton
          label="Undo"
          icon="lucide:undo-2"
          run={() => chain().undo().run()}
          disabled={!state.undo}
        />
        <ToolButton
          label="Redo"
          icon="lucide:redo-2"
          run={() => chain().redo().run()}
          disabled={!state.redo}
        />
        <Separator orientation="vertical" />
        <TextStyleSelects editor={editor} state={state} />
        <Separator orientation="vertical" />
        <ToolButton
          label="Bold"
          icon="lucide:bold"
          run={() => chain().toggleBold().run()}
          pressed={state.bold}
        />
        <ToolButton
          label="Italic"
          icon="lucide:italic"
          run={() => chain().toggleItalic().run()}
          pressed={state.italic}
        />
        <ToolButton
          label="Underline"
          icon="lucide:underline"
          run={() => chain().toggleUnderline().run()}
          pressed={state.underline}
        />
        <ToolButton
          label="Strikethrough"
          icon="lucide:strikethrough"
          run={() => chain().toggleStrike().run()}
          pressed={state.strike}
        />
        <label className="color-control" title="Text color">
          <span>A</span>
          <input
            aria-label="Text color"
            type="color"
            defaultValue="#222222"
            onChange={(e) => chain().setColor(e.target.value).run()}
          />
        </label>
        <ToolButton
          label="Clear formatting"
          icon="lucide:eraser"
          run={() => chain().unsetAllMarks().clearNodes().run()}
        />
        <Separator orientation="vertical" />
        {alignments.map((alignment) => (
          <span key={alignment}>
            <ToolButton
              label={`Align ${alignment}`}
              icon={`lucide:align-${alignment}`}
              run={() => chain().setTextAlign(alignment).run()}
              pressed={state.align === alignment}
            />
          </span>
        ))}
        <Separator orientation="vertical" />
        <ToolButton
          label="Bulleted list"
          icon="lucide:list"
          run={() => chain().toggleBulletList().run()}
          pressed={state.bullet}
        />
        <ToolButton
          label="Numbered list"
          icon="lucide:list-ordered"
          run={() => chain().toggleOrderedList().run()}
          pressed={state.ordered}
        />
        <ToolButton
          label="Insert or edit link"
          icon="lucide:link-2"
          run={() =>
            setLinkHref((open) =>
              open === null ? (editor.getAttributes('link').href ?? '') : null,
            )
          }
          pressed={state.link}
        />
        <ToolButton
          label="Insert table"
          icon="lucide:table-2"
          run={() => chain().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}
        />
        <ToolButton
          label="Horizontal rule"
          icon="lucide:minus"
          run={() => chain().setHorizontalRule().run()}
        />
      </Toolbar>
      {linkHref !== null && (
        <LinkForm editor={editor} initialHref={linkHref} onClose={() => setLinkHref(null)} />
      )}
      {state.table && <TableActions editor={editor} />}
    </>
  )
}
