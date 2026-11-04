import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Separator, Toolbar } from '@heroui/react'
import FindBar from './FindBar'
import HighlightMenu from './HighlightMenu'
import InsertMenu from './InsertMenu'
import LinkForm from './LinkForm'
import PageSetupBar from './PageSetupBar'
import TableActions from './TableActions'
import TextStyleSelects from './TextStyleSelects'
import ToolButton from './ToolButton'
import { useToolbarState } from './useToolbarState'

const alignments = ['left', 'center', 'right', 'justify'] as const

/**
 * The formatting toolbar, and the bars it opens below itself: link, find and replace, page
 * setup, and table actions. ⌘F (Ctrl+F) opens find.
 */
export default function EditorToolbar({
  editor,
  outline,
  onToggleOutline,
}: {
  editor: Editor
  outline: boolean
  onToggleOutline: () => void
}) {
  const state = useToolbarState(editor)
  const [linkHref, setLinkHref] = useState<string | null>(null)
  const [finding, setFinding] = useState(false)
  const [pageSetup, setPageSetup] = useState(false)
  const chain = () => editor.chain().focus()
  useEffect(() => {
    const find = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setFinding(true)
      }
    }
    window.addEventListener('keydown', find)
    return () => window.removeEventListener('keydown', find)
  }, [])
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
        <ToolButton
          label="Superscript"
          icon="lucide:superscript"
          run={() => chain().toggleMark('superscript').run()}
          pressed={state.superscript}
        />
        <ToolButton
          label="Subscript"
          icon="lucide:subscript"
          run={() => chain().toggleMark('subscript').run()}
          pressed={state.subscript}
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
        <HighlightMenu editor={editor} current={state.highlight} />
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
          label="Decrease indent"
          icon="lucide:indent-decrease"
          run={() => chain().liftListItem('listItem').run()}
          disabled={!state.outdent}
        />
        <ToolButton
          label="Increase indent"
          icon="lucide:indent-increase"
          run={() => chain().sinkListItem('listItem').run()}
          disabled={!state.indent}
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
        <InsertMenu editor={editor} />
        <Separator orientation="vertical" />
        <ToolButton
          label="Find and replace"
          icon="lucide:search"
          run={() => setFinding((open) => !open)}
          pressed={finding}
        />
        <ToolButton
          label="Outline"
          icon="lucide:list-tree"
          run={onToggleOutline}
          pressed={outline}
        />
        <ToolButton
          label="Page setup"
          icon="lucide:ruler"
          run={() => setPageSetup((open) => !open)}
          pressed={pageSetup}
        />
      </Toolbar>
      {linkHref !== null && (
        <LinkForm editor={editor} initialHref={linkHref} onClose={() => setLinkHref(null)} />
      )}
      {finding && <FindBar editor={editor} onClose={() => setFinding(false)} />}
      {pageSetup && <PageSetupBar editor={editor} onClose={() => setPageSetup(false)} />}
      {state.table && <TableActions editor={editor} />}
    </>
  )
}
