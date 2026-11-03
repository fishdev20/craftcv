import { describe, it, expect } from 'vitest'
import {
  documentHTML,
  documentText,
  layoutStyle,
  pageLayout,
  parseDocument,
  safeLink,
  textDocument,
  type DocumentNode,
} from '../src/shared/document'
import { toWordDocument } from '../src/main/documents/document-docx'
import { Packer } from 'docx'
import JSZip from 'jszip'
const document: DocumentNode = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1, textAlign: 'center' },
      content: [{ type: 'text', text: 'Alex & Example' }],
    },
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: 'Engineer',
          marks: [
            { type: 'bold' },
            { type: 'italic' },
            { type: 'underline' },
            { type: 'link', attrs: { href: 'https://example.com' } },
          ],
        },
      ],
    },
    {
      type: 'orderedList',
      attrs: { start: 3 },
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Built an interface' }] }],
        },
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              attrs: { colspan: 1, rowspan: 1 },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Skills' }] }],
            },
            {
              type: 'tableCell',
              attrs: { colspan: 1, rowspan: 1 },
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'React' }] }],
            },
          ],
        },
      ],
    },
  ],
}
describe('structured resume documents', () => {
  it('preserves formatting and produces plain text for the existing tailoring pipeline', () => {
    expect(parseDocument(document)).toEqual(document)
    expect(documentText(document)).toContain('Skills\tReact')
    const html = documentHTML(document)
    expect(html).toContain('<h1 style="text-align:center">Alex &amp; Example</h1>')
    expect(html).toContain('<ol start="3">')
    expect(html).toContain('<table>')
    expect(html).toContain('<u><em><strong>Engineer</strong></em></u>')
  })
  it('rejects executable links, invalid nodes, oversized content and excessive nesting', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd'])
      expect(safeLink(href)).toBe(false)
    expect(() =>
      parseDocument({ type: 'doc', content: [{ type: 'script', text: 'alert(1)' }] }),
    ).toThrow()
    expect(() => parseDocument(textDocument('x'.repeat(100001)))).toThrow()
    let node: DocumentNode = { type: 'paragraph' }
    for (let i = 0; i < 20; i++) node = { type: 'blockquote', content: [node] }
    expect(() => parseDocument({ type: 'doc', content: [node] })).toThrow()
    expect(documentHTML(textDocument('<script>alert(1)</script>'))).toContain('&lt;script&gt;')
  })
  it('writes actual Word heading, list, link and table elements', async () => {
    const buffer = await Packer.toBuffer(toWordDocument(document))
    const zip = await JSZip.loadAsync(buffer)
    const xml = await zip.file('word/document.xml')!.async('string')
    expect(xml).toContain('Heading1')
    expect(xml).toContain('<w:b/>')
    expect(xml).toContain('<w:i/>')
    expect(xml).toContain('<w:tbl>')
    expect(xml).toContain('<w:hyperlink')
    expect(xml).toContain('<w:numPr>')
    expect(await zip.file('word/numbering.xml')!.async('string')).toContain('w:val="3"')
  })
})

it('keeps a validated page layout and top-level page breaks', () => {
  const paragraph = { type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }
  const doc = parseDocument({
    type: 'doc',
    attrs: {
      margins: [13.1, 14.6, 13.1, 15],
      lineHeight: 1.322,
      blockSpacing: 0,
      listIndent: 36,
      fontSize: 10,
      unknown: 'dropped',
    },
    content: [paragraph, { type: 'pageBreak' }, paragraph],
  })
  expect(doc.attrs).toEqual({
    margins: [13.1, 14.6, 13.1, 15],
    lineHeight: 1.322,
    blockSpacing: 0,
    listIndent: 36,
    fontSize: 10,
  })
  expect(pageLayout(doc)).toMatchObject({ fontSize: 10, blockSpacing: 0 })
  expect(layoutStyle(pageLayout(doc))).toContain('--margin-top:13.1pt')
  expect(documentHTML(doc)).toBe('<p>Hi</p><div class="page-break"></div><p>Hi</p>')
  // the editor's own spacing, for documents that were not imported
  expect(pageLayout({ type: 'doc', content: [paragraph] })).toEqual({
    margins: [43.2, 43.2, 43.2, 43.2],
    lineHeight: 1.5,
    blockSpacing: null,
    listIndent: 24,
    fontSize: 11,
  })
  expect(() =>
    parseDocument({ type: 'doc', attrs: { margins: [500, 0, 0, 0] }, content: [paragraph] }),
  ).toThrow()
  expect(() =>
    parseDocument({
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [paragraph, { type: 'pageBreak' }] }],
        },
      ],
    }),
  ).toThrow()
})

it('exports an imported layout to Word: margins, line spacing and page breaks', async () => {
  const paragraph = { type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }
  const doc = {
    type: 'doc',
    attrs: {
      margins: [13, 14, 13, 15],
      lineHeight: 1.3,
      blockSpacing: 0,
      listIndent: 36,
      fontSize: 10,
    },
    content: [paragraph, { type: 'pageBreak' }, paragraph],
  }
  const zip = await JSZip.loadAsync(await Packer.toBuffer(toWordDocument(doc)))
  const xml = await zip.file('word/document.xml')!.async('string')
  expect(xml).toContain('w:top="260"')
  expect(xml).toContain('w:left="300"')
  expect(xml).toContain('<w:pageBreakBefore/>')
  expect(xml).toContain('w:line="312"')
  expect(await zip.file('word/styles.xml')!.async('string')).toContain('w:val="20"')
})
