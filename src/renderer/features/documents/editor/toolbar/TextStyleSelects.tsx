import type { Editor } from '@tiptap/react'
import SelectField from '@/common/ui/SelectField'
import type { ToolbarState } from './useToolbarState'

const paragraphStyles = [
  { id: 'paragraph', label: 'Normal text' },
  { id: '1', label: 'Heading 1' },
  { id: '2', label: 'Heading 2' },
  { id: '3', label: 'Heading 3' },
]
const fonts = ['Arial', 'Georgia', 'Times New Roman', 'Verdana'].map((f) => ({ id: f, label: f }))
const sizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36].map((n) => ({
  id: `${n}pt`,
  label: String(n),
}))

export default function TextStyleSelects({
  editor,
  state,
}: {
  editor: Editor
  state: ToolbarState
}) {
  return (
    <>
      <SelectField
        label="Paragraph style"
        hideLabel
        className="toolbar-select"
        value={state.heading}
        options={paragraphStyles}
        onChange={(value) =>
          value === 'paragraph'
            ? editor.chain().focus().setParagraph().run()
            : editor
                .chain()
                .focus()
                .setHeading({ level: Number(value) as 1 | 2 | 3 })
                .run()
        }
      />
      <SelectField
        label="Font family"
        hideLabel
        className="toolbar-select"
        value={state.font}
        options={fonts}
        onChange={(value) => editor.chain().focus().setFontFamily(value).run()}
      />
      <SelectField
        label="Font size"
        hideLabel
        className="toolbar-select toolbar-select-narrow"
        value={state.size}
        options={sizes}
        onChange={(value) => editor.chain().focus().setFontSize(value).run()}
      />
    </>
  )
}
