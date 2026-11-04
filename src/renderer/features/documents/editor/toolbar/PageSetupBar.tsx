import { useEditorState, type Editor } from '@tiptap/react'
import { Button, Label, NumberField } from '@heroui/react'
import SelectField from '@/common/ui/SelectField'
import { Icon } from '@/common/ui/icons'
import { pageLayout, type DocumentNode } from '@shared/document'
import { setLayout } from '../extensions'

const inch = (n: number) => Math.round(n * 72 * 10) / 10
const MARGINS = [
  { id: 'narrow', label: 'Narrow · 0.5 in', value: inch(0.5) },
  { id: 'moderate', label: 'Moderate · 0.6 in', value: inch(0.6) },
  { id: 'normal', label: 'Normal · 0.75 in', value: inch(0.75) },
  { id: 'wide', label: 'Wide · 1 in', value: inch(1) },
]
const SIDES = ['Top', 'Right', 'Bottom', 'Left'] as const
const toInches = (points: number) => Math.round((points / 72) * 100) / 100

const LINE_SPACING = ['1', '1.15', '1.25', '1.5', '2'].map((value) => ({ id: value, label: value }))
const PARAGRAPH_SPACING = [
  { id: 'default', label: 'Editor default' },
  ...[0, 3, 6, 9, 12].map((pt) => ({ id: String(pt), label: pt ? `${pt} pt after` : 'None' })),
]

/**
 * Margins, line spacing and space between paragraphs, stored on the document so the editor's
 * pages and both exports use them.
 */
export default function PageSetupBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const layout = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      pageLayout({ type: 'doc', attrs: e.state.doc.attrs } as DocumentNode),
  })
  const [top, right, bottom, left] = layout.margins
  const uniform = top === right && right === bottom && bottom === left
  const margin = uniform ? MARGINS.find((option) => option.value === top)?.id : undefined
  const imported = layout.blockSpacing !== null
  const spacing = imported ? layout.blockSpacing : layout.paragraphSpacing
  const spacingId =
    spacing === null
      ? 'default'
      : PARAGRAPH_SPACING.some((option) => option.id === String(spacing))
        ? String(spacing)
        : 'default'
  const lineSpacing = LINE_SPACING.find((option) => Number(option.id) === layout.lineHeight)?.id
  return (
    <div className="editor-page-setup" role="group" aria-label="Page setup">
      <SelectField
        label="Margins"
        className="page-setup-select"
        value={margin ?? 'custom'}
        options={[
          ...(margin ? [] : [{ id: 'custom', label: 'Custom' }]),
          ...MARGINS.map(({ id, label }) => ({ id, label })),
        ]}
        onChange={(id) => {
          const option = MARGINS.find((candidate) => candidate.id === id)
          if (option)
            setLayout(editor, { margins: [option.value, option.value, option.value, option.value] })
        }}
      />
      <div className="page-margins" role="group" aria-label="Margins in inches">
        {SIDES.map((side, index) => (
          <NumberField
            key={side}
            className="page-margin-field"
            value={toInches(layout.margins[index])}
            minValue={0}
            maxValue={2}
            step={0.05}
            formatOptions={{ maximumFractionDigits: 2 }}
            onChange={(inches) => {
              if (inches === undefined || Number.isNaN(inches)) return
              const margins = [...layout.margins]
              margins[index] = Math.round(inches * 72 * 10) / 10
              setLayout(editor, { margins })
            }}
          >
            <Label>{side}</Label>
            <NumberField.Group>
              <NumberField.Input />
            </NumberField.Group>
          </NumberField>
        ))}
        <span className="page-margins-unit">in</span>
      </div>
      <SelectField
        label="Line spacing"
        className="page-setup-select page-setup-select--narrow"
        value={lineSpacing ?? 'custom'}
        options={[
          ...(lineSpacing ? [] : [{ id: 'custom', label: String(layout.lineHeight) }]),
          ...LINE_SPACING,
        ]}
        onChange={(value) => {
          if (value !== 'custom') setLayout(editor, { lineHeight: Number(value) })
        }}
      />
      <SelectField
        label="Space after paragraphs"
        className="page-setup-select"
        value={spacingId}
        options={PARAGRAPH_SPACING}
        onChange={(value) => {
          const points = value === 'default' ? null : Number(value)
          // an imported PDF keeps its rhythm in blockSpacing; other documents use paragraphSpacing
          setLayout(editor, imported ? { blockSpacing: points ?? 0 } : { paragraphSpacing: points })
        }}
      />
      <Button isIconOnly size="sm" variant="ghost" aria-label="Close page setup" onPress={onClose}>
        <Icon icon="lucide:x" width={15} />
      </Button>
    </div>
  )
}
