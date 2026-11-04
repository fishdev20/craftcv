import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  LevelFormat,
  Paragraph,
  Tab,
  Table,
  TableCell,
  TableRow,
  TabStopType,
  TextRun,
  WidthType,
  type ParagraphChild,
} from 'docx'
import { A4, pageLayout, parseDocument, type DocumentNode } from '../../shared/document'

/** Word measures in twentieths of a point, and line spacing in 240ths of a line. */
const twips = (points: number) => Math.round(points * 20)

/** Map the validated editor schema to native Word paragraphs, runs, lists and tables. */
export function toWordDocument(input: DocumentNode): Document {
  const root = parseDocument(input)
  const layout = pageLayout(root),
    exact = layout.blockSpacing !== null,
    // the space after paragraphs the person chose, else Word's usual 6pt
    paragraphAfter = layout.paragraphSpacing === null ? 120 : twips(layout.paragraphSpacing)
  let pageBreak = false
  const numbering: {
    reference: string
    levels: {
      level: number
      format: typeof LevelFormat.BULLET | typeof LevelFormat.DECIMAL
      text: string
      start: number
      alignment: typeof AlignmentType.LEFT
      style: { paragraph: { indent: { left: number; hanging: number } } }
    }[]
  }[] = []
  function inline(node: DocumentNode, heading = false): ParagraphChild[] {
    if (node.type === 'hardBreak') return [new TextRun({ break: 1 })]
    const marks = node.marks ?? [],
      style = marks.find((m) => m.type === 'textStyle')?.attrs ?? {}
    const run = new TextRun({
      text: node.text ?? '',
      // an imported layout sizes its headings by their runs, so they are plain bold paragraphs
      bold: marks.some((m) => m.type === 'bold') || (heading && exact) || undefined,
      italics: marks.some((m) => m.type === 'italic'),
      underline: marks.some((m) => m.type === 'underline') ? {} : undefined,
      strike: marks.some((m) => m.type === 'strike'),
      subScript: marks.some((m) => m.type === 'subscript') || undefined,
      superScript: marks.some((m) => m.type === 'superscript') || undefined,
      font: style.fontFamily ?? undefined,
      size: style.fontSize ? Number.parseInt(style.fontSize) * 2 : undefined,
      color: style.color?.slice(1),
      shading: style.backgroundColor ? { fill: style.backgroundColor.slice(1) } : undefined,
    })
    const href = marks.find((m) => m.type === 'link')?.attrs?.href
    return href ? [new ExternalHyperlink({ link: href, children: [run] })] : [run]
  }
  type Context = { reference: string; depth: number }
  function blocks(nodes: DocumentNode[], list?: Context): (Paragraph | Table)[] {
    return nodes.flatMap((node, index): (Paragraph | Table)[] => {
      const content = node.content ?? []
      if (node.type === 'table')
        return [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: content.map(
              (row) =>
                new TableRow({
                  children: (row.content ?? []).map(
                    (cell) =>
                      new TableCell({
                        columnSpan: Number(cell.attrs?.colspan ?? 1),
                        rowSpan: Number(cell.attrs?.rowspan ?? 1),
                        shading: cell.type === 'tableHeader' ? { fill: 'F2F2F2' } : undefined,
                        children: blocks(cell.content ?? []),
                      }),
                  ),
                }),
            ),
          }),
        ]
      if (['bulletList', 'orderedList'].includes(node.type)) {
        const reference = `list-${numbering.length}`,
          depth = Math.min(8, list ? list.depth + 1 : 0)
        numbering.push({
          reference,
          levels: Array.from({ length: 9 }, (_, level) => ({
            level,
            format: node.type === 'bulletList' ? LevelFormat.BULLET : LevelFormat.DECIMAL,
            text: node.type === 'bulletList' ? '•' : `%${level + 1}.`,
            start: Number(node.attrs?.start ?? 1),
            alignment: AlignmentType.LEFT,
            style: {
              paragraph: { indent: { left: twips(layout.listIndent) * (level + 1), hanging: 260 } },
            },
          })),
        })
        return content.flatMap((item) => blocks(item.content ?? [], { reference, depth }))
      }
      if (node.type === 'blockquote') return blocks(content).map((block) => block)
      if (node.type === 'pageBreak') {
        pageBreak = true
        return []
      }
      if (node.type === 'entryLine') {
        // the right part sits at a right tab stop on the text's edge, so it reads as one line
        const [start, end] = content
        const width = twips(A4.width - layout.margins[1] - layout.margins[3])
        const breakBefore = pageBreak
        pageBreak = false
        return [
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: width }],
            children: [
              ...(start?.content ?? []).flatMap((child) => inline(child)),
              new TextRun({ children: [new Tab()] }),
              ...(end?.content ?? []).flatMap((child) => inline(child)),
            ],
            pageBreakBefore: breakBefore || undefined,
            numbering:
              list && index === 0 ? { reference: list.reference, level: list.depth } : undefined,
            spacing: exact
              ? {
                  after: twips(layout.blockSpacing ?? 0),
                  line: Math.round(layout.lineHeight * 240),
                }
              : { after: paragraphAfter, line: Math.round(layout.lineHeight * 240) },
          }),
        ]
      }
      if (node.type === 'horizontalRule')
        return [
          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'AAAAAA' } },
            ...(exact && { spacing: { after: 0, line: Math.round(layout.lineHeight * 120) } }),
          }),
        ]
      const heading =
        node.type === 'heading' && !exact
          ? [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][
              Number(node.attrs?.level ?? 1) - 1
            ]
          : undefined
      const alignment = (
        {
          left: AlignmentType.LEFT,
          center: AlignmentType.CENTER,
          right: AlignmentType.RIGHT,
          justify: AlignmentType.JUSTIFIED,
        } as const
      )[String(node.attrs?.textAlign ?? 'left') as 'left']
      const breakBefore = pageBreak
      pageBreak = false
      return [
        new Paragraph({
          children: content.flatMap((child) => inline(child, node.type === 'heading')),
          heading,
          pageBreakBefore: breakBefore || undefined,
          outlineLevel:
            node.type === 'heading' && exact ? Number(node.attrs?.level ?? 1) - 1 : undefined,
          alignment,
          numbering:
            list && index === 0 ? { reference: list.reference, level: list.depth } : undefined,
          spacing: exact
            ? { after: twips(layout.blockSpacing ?? 0), line: Math.round(layout.lineHeight * 240) }
            : { after: paragraphAfter, line: Math.round(layout.lineHeight * 240) },
          keepNext: node.type === 'heading',
        }),
      ]
    })
  }
  const content = blocks(root.content ?? [])
  return new Document({
    creator: 'CraftCV',
    styles: { default: { document: { run: { font: 'Arial', size: layout.fontSize * 2 } } } },
    numbering: { config: numbering },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: {
              top: twips(layout.margins[0]),
              right: twips(layout.margins[1]),
              bottom: twips(layout.margins[2]),
              left: twips(layout.margins[3]),
            },
          },
        },
        children: content,
      },
    ],
  })
}
