import { useEditorState, type Editor } from '@tiptap/react'
import { Typography } from '@heroui/react'

type Heading = { pos: number; level: number; text: string }

/** The document's headings, each a link to its place on the page. */
export default function OutlinePanel({ editor }: { editor: Editor }) {
  const headings = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const found: Heading[] = []
      e.state.doc.forEach((node, pos) => {
        if (node.type.name === 'heading' && node.textContent.trim())
          found.push({ pos, level: Number(node.attrs.level ?? 1), text: node.textContent.trim() })
      })
      return found
    },
    equalityFn: (a, b) =>
      !!b &&
      a.length === b.length &&
      a.every((h, i) => h.pos === b[i].pos && h.text === b[i].text && h.level === b[i].level),
  })
  const go = (heading: Heading) => {
    editor
      .chain()
      .focus()
      .setTextSelection(heading.pos + 1)
      .run()
    const dom = editor.view.nodeDOM(heading.pos)
    if (dom instanceof HTMLElement) dom.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
  return (
    <nav className="editor-outline" aria-label="Document outline">
      <Typography.Heading level={2} className="editor-outline-title">
        Outline
      </Typography.Heading>
      {headings.length ? (
        <ul>
          {headings.map((heading) => (
            <li key={heading.pos} data-level={heading.level}>
              <button type="button" onClick={() => go(heading)}>
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Typography.Paragraph size="xs" color="muted">
          Headings you add appear here.
        </Typography.Paragraph>
      )}
    </nav>
  )
}
