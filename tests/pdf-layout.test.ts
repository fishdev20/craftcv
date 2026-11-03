import { expect, it } from 'vitest'
import { parseDocument, type DocumentNode } from '../src/shared/document'
import { pdfDocument, type PdfPage, type PdfText } from '../src/main/documents/pdf-layout'

const WIDTH = 596
const text = (value: string, x: number, y: number, options: Partial<PdfText> = {}): PdfText => ({
  text: value,
  x,
  y,
  // roughly Arial at 11pt
  width: value.length * 5.5,
  size: 11,
  bold: false,
  italic: false,
  ...options,
})
// a page as tall as its text, so no blank lines fill the space above it
const page = (texts: PdfText[], extra: Partial<PdfPage> = {}): PdfPage => ({
  width: WIDTH,
  height: Math.max(...texts.map((t) => t.y)) + 30,
  texts,
  links: [],
  rules: [],
  ...extra,
})
const long = 'x'.repeat(98)

/** The document's blocks without text sizes, which the structure tests leave to their own test. */
function blocksOf(doc: DocumentNode | null): DocumentNode[] {
  const strip = (node: DocumentNode): DocumentNode => {
    const out: DocumentNode = { ...node }
    const marks = node.marks?.filter((mark) => mark.type !== 'textStyle')
    if (marks?.length) out.marks = marks
    else delete out.marks
    if (node.content) out.content = node.content.map(strip)
    return out
  }
  return (doc?.content ?? []).map(strip)
}

it('rebuilds a CV header: centred name, title and linked contact line, then a divider', () => {
  const doc = pdfDocument([
    page(
      [
        text('Ada Lovelace', 250, 800, { size: 16, bold: true, width: 100 }),
        text('Engineer', 265, 780, { size: 14, bold: true, italic: true, width: 66 }),
        text('Helsinki |', 200, 760, { width: 50 }),
        text(' ', 250, 760, { width: 4, size: 0 }),
        text('Website', 254, 760, { width: 40 }),
        text('| ada@example.com', 297, 760, { width: 100 }),
        text('SKILLS', 15, 735, { size: 12, bold: true, width: 43 }),
        text('Body text that fills the line ' + long, 15, 720, { width: 560 }),
      ],
      { rules: [748], links: [{ url: 'https://ada.example', rect: [254, 757, 294, 771] }] },
    ),
  ])
  expect(blocksOf(doc)).toEqual([
    {
      type: 'heading',
      attrs: { level: 1, textAlign: 'center' },
      content: [{ type: 'text', text: 'Ada Lovelace' }],
    },
    {
      type: 'heading',
      attrs: { level: 2, textAlign: 'center' },
      content: [{ type: 'text', text: 'Engineer', marks: [{ type: 'italic' }] }],
    },
    {
      type: 'paragraph',
      attrs: { textAlign: 'center' },
      content: [
        { type: 'text', text: 'Helsinki | ' },
        {
          type: 'text',
          text: 'Website',
          marks: [{ type: 'link', attrs: { href: 'https://ada.example' } }],
        },
        { type: 'text', text: ' | ada@example.com' },
      ],
    },
    { type: 'horizontalRule' },
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'SKILLS' }] },
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'Body text that fills the line ' + long }],
    },
  ])
  expect(() => parseDocument(doc)).not.toThrow()
})

it('joins wrapped lines into one paragraph, and keeps bold phrases', () => {
  const doc = pdfDocument([
    page([
      text('Java • Spring Boot •', 15, 700, { width: 100 }),
      text('TypeScript', 118, 700, { bold: true, width: 56 }),
      text('• and many more skills ' + long, 177, 700, { width: 400 }),
      text('Redis • Claude', 15, 685.5, { width: 75 }),
      text('A new paragraph after a gap', 15, 650, { width: 150 }),
    ]),
  ])
  expect(blocksOf(doc)).toEqual([
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Java • Spring Boot • ' },
        { type: 'text', text: 'TypeScript', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' • and many more skills ' + long + ' Redis • Claude' },
      ],
    },
    // the gap of one empty line in the PDF
    { type: 'paragraph' },
    { type: 'paragraph', content: [{ type: 'text', text: 'A new paragraph after a gap' }] },
  ])
})

it('turns bullet glyphs into one list, wrapped lines joined to their item', () => {
  const doc = pdfDocument([
    page([
      text('●', 29, 600, { width: 6.6 }),
      text('Built a thing ' + long, 51, 600, { width: 520 }),
      text('that wrapped.', 51, 585.5, { width: 70 }),
      text('●', 29, 571, { width: 6.6 }),
      text('Shipped another.', 51, 571, { width: 90 }),
    ]),
  ])
  expect(blocksOf(doc)).toEqual([
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: `Built a thing ${long} that wrapped.` }],
            },
          ],
        },
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Shipped another.' }] }],
        },
      ],
    },
  ])
})

it('separates a right-aligned date, and reads capitals at body size as a section title', () => {
  const doc = pdfDocument([
    page([
      text('SKILLS', 15, 760, { size: 12, bold: true, width: 43 }),
      text('Engineer | Acme', 15, 740, { bold: true, width: 80 }),
      text('2022 - Present', 500, 740, { width: 75 }),
      text('Next line at the same indent', 15, 725.5, { width: 150 }),
      text('EDUCATION', 15, 711, { bold: true, width: 64 }),
    ]),
  ])
  expect(blocksOf(doc).map((node) => [node.type, node.attrs?.level])).toEqual([
    // the only larger size is the top level; capitals match it
    ['heading', 1],
    ['paragraph', undefined],
    ['paragraph', undefined],
    ['heading', 1],
  ])
  expect(
    blocksOf(doc)[1]
      .content?.map((node) => node.text)
      .join(''),
  ).toBe('Engineer | Acme | 2022 - Present')
})

it('drops unsafe links and returns nothing for a page without text', () => {
  const doc = pdfDocument([
    page([text('Click', 15, 700, { width: 30 })], {
      links: [{ url: 'javascript:alert(1)', rect: [15, 697, 45, 711] }],
    }),
  ])
  expect(doc?.content?.[0].content).toEqual([{ type: 'text', text: 'Click' }])
  expect(pdfDocument([page([text(' ', 15, 700, { size: 0 })])])).toBeNull()
})

it('measures the page layout, keeps text sizes, and breaks where the PDF page ended', () => {
  const doc = pdfDocument([
    page(
      [
        text('Ada Lovelace', 250, 800, { size: 16, bold: true, width: 100 }),
        text('First paragraph line that runs ' + long, 20, 780, { size: 10, width: 556 }),
        text('and wraps onto a second line.', 20, 767, { size: 10, width: 150 }),
        text('●', 30, 754, { size: 10, width: 6 }),
        text('An item', 50, 754, { size: 10, width: 40 }),
      ],
      { height: 842 },
    ),
    page([text('Page two, one blank line down', 20, 798, { size: 10, width: 160 })], {
      height: 842,
    }),
  ])
  // body text at 10pt, baselines 13pt apart: a line height of 1.3
  expect(doc?.attrs).toMatchObject({ lineHeight: 1.3, blockSpacing: 0, fontSize: 10 })
  const [top, right, bottom, left] = doc!.attrs!.margins as number[]
  expect([right, left, bottom <= top]).toEqual([20, 20, true])
  expect(doc?.attrs?.listIndent).toBe(30)
  // only text that differs from the body size carries a size
  expect(doc?.content?.[0].content?.[0].marks).toEqual([
    { type: 'textStyle', attrs: { fontSize: '16pt' } },
  ])
  expect(doc?.content?.map((node) => node.type)).toEqual([
    'heading',
    'paragraph',
    'bulletList',
    'pageBreak',
    // page two's text starts a line below the top margin
    'paragraph',
    'paragraph',
  ])
  expect(doc?.content?.[4].content).toBeUndefined()
  expect(() => parseDocument(doc)).not.toThrow()
})
