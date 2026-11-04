import { useEditorState, type Editor } from '@tiptap/react'

/** What the toolbar shows for the current selection. */
export function useToolbarState(editor: Editor) {
  return useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      superscript: e.isActive('superscript'),
      subscript: e.isActive('subscript'),
      highlight: (e.getAttributes('textStyle').backgroundColor as string | undefined) ?? null,
      indent: e.can().sinkListItem('listItem'),
      outdent: e.can().liftListItem('listItem'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      align:
        e.getAttributes('paragraph').textAlign ?? e.getAttributes('heading').textAlign ?? 'left',
      heading: e.isActive('heading') ? String(e.getAttributes('heading').level) : 'paragraph',
      font: e.getAttributes('textStyle').fontFamily ?? 'Arial',
      size: e.getAttributes('textStyle').fontSize ?? '11pt',
      undo: e.can().undo(),
      redo: e.can().redo(),
      table: e.isActive('table'),
      link: e.isActive('link'),
    }),
  })
}

export type ToolbarState = ReturnType<typeof useToolbarState>
