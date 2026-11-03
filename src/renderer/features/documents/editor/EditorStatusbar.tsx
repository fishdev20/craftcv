import { Kbd } from '@heroui/react'
import { documentText, type DocumentNode } from '@shared/document'
import SelectField from '@/common/ui/SelectField'

const zoomLevels = ['75', '90', '100', '110', '125'].map((z) => ({ id: z, label: `${z}%` }))

/** One slim line under the pages: the counts, the save shortcut, and the zoom. */
export default function EditorStatusbar({
  document,
  zoom,
  onZoom,
}: {
  document: DocumentNode
  zoom: string
  onZoom: (zoom: string) => void
}) {
  const text = documentText(document),
    words = text.trim() ? text.trim().split(/\s+/u).length : 0
  return (
    <footer className="editor-statusbar">
      <span>
        {words.toLocaleString()} words, {text.length.toLocaleString()} of 100,000 characters
      </span>
      <span className="editor-statusbar-end">
        <span className="editor-shortcut">
          <Kbd>Ctrl+S</Kbd> / <Kbd>⌘S</Kbd> to save
        </span>
        <SelectField
          label="Zoom"
          hideLabel
          className="zoom-select"
          value={zoom}
          options={zoomLevels}
          onChange={onZoom}
        />
      </span>
    </footer>
  )
}
