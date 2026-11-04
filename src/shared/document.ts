import { z } from 'zod'

export type DocumentMark = { type: string; attrs?: Record<string, string | null> }
export type DocumentNode = {
  type: string
  text?: string
  attrs?: Record<string, string | number | number[] | null>
  marks?: DocumentMark[]
  content?: DocumentNode[]
}
const blocks = [
  'paragraph',
  'heading',
  'entryLine',
  'bulletList',
  'orderedList',
  'blockquote',
  'horizontalRule',
  'table',
]
const children: Record<string, string[]> = {
  // a page break only sits between top-level blocks
  doc: [...blocks, 'pageBreak'],
  paragraph: ['text', 'hardBreak'],
  heading: ['text', 'hardBreak'],
  // a line with a part on the left and a part flush right, such as a role and its dates
  entryLine: ['entryStart', 'entryEnd'],
  entryStart: ['text', 'hardBreak'],
  entryEnd: ['text', 'hardBreak'],
  bulletList: ['listItem'],
  orderedList: ['listItem'],
  listItem: blocks,
  blockquote: blocks,
  table: ['tableRow'],
  tableRow: ['tableCell', 'tableHeader'],
  tableCell: blocks,
  tableHeader: blocks,
  text: [],
  hardBreak: [],
  horizontalRule: [],
  pageBreak: [],
}

/** An A4 page in points, the size every document is laid out and exported on. */
export const A4 = { width: 595.28, height: 841.89 }

/**
 * How a document sits on its pages, in points. Without `blockSpacing` blocks keep the editor's
 * own spacing; with it, every block is spaced by that amount and blank lines carry the rest,
 * which is how an imported PDF keeps its vertical rhythm.
 */
type PageLayout = {
  margins: [number, number, number, number]
  lineHeight: number
  blockSpacing: number | null
  listIndent: number
  /** The size body text is set in; text with no size of its own uses it. */
  fontSize: number
  /** Space after each paragraph in an ordinary document; null keeps the editor's own. */
  paragraphSpacing: number | null
}

/** A document's page layout, with the defaults for anything it does not set. */
export function pageLayout(document: DocumentNode): PageLayout {
  const attrs = document.attrs ?? {}
  const number = (value: unknown, fallback: number) =>
    typeof value === 'number' ? value : fallback
  return {
    margins:
      Array.isArray(attrs.margins) && attrs.margins.length === 4
        ? (attrs.margins as PageLayout['margins'])
        : [43.2, 43.2, 43.2, 43.2],
    lineHeight: number(attrs.lineHeight, 1.5),
    blockSpacing: typeof attrs.blockSpacing === 'number' ? attrs.blockSpacing : null,
    listIndent: number(attrs.listIndent, 24),
    fontSize: number(attrs.fontSize, 11),
    paragraphSpacing: typeof attrs.paragraphSpacing === 'number' ? attrs.paragraphSpacing : null,
  }
}

/** The layout as CSS custom properties, for the editor's pages and the print surface alike. */
export function layoutStyle(layout: PageLayout): string {
  const [top, right, bottom, left] = layout.margins
  return [
    `--margin-top:${top}pt`,
    `--margin-right:${right}pt`,
    `--margin-bottom:${bottom}pt`,
    `--margin-left:${left}pt`,
    `--line-height:${layout.lineHeight}`,
    `--font-size:${layout.fontSize}pt`,
    `--list-indent:${layout.listIndent}pt`,
    ...(layout.blockSpacing === null ? [] : [`--block-space:${layout.blockSpacing}pt`]),
    ...(layout.paragraphSpacing === null ? [] : [`--paragraph-space:${layout.paragraphSpacing}pt`]),
  ].join(';')
}
export function safeLink(value: string): boolean {
  try {
    return (
      ['https:', 'http:', 'mailto:'].includes(new URL(value).protocol) &&
      !Array.from(value).some((character) => character.charCodeAt(0) < 32)
    )
  } catch {
    return false
  }
}
/** Validate bounded structured documents before persistence or export. Never accept renderer HTML. */
export function parseDocument(input: unknown): DocumentNode {
  let count = 0,
    characters = 0
  function visit(value: unknown, depth: number): DocumentNode {
    if (++count > 5000 || depth > 16) throw new Error('Document exceeds the size or nesting limit.')
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('Invalid document node.')
    const node = value as Record<string, unknown>,
      type = node.type
    if (typeof type !== 'string' || !Object.hasOwn(children, type))
      throw new Error('Unsupported document content.')
    const out: DocumentNode = { type }
    if (type === 'text') {
      if (typeof node.text !== 'string' || !node.text.length) throw new Error('Invalid text node.')
      characters += node.text.length
      if (characters > 100000) throw new Error('Document exceeds 100,000 characters.')
      out.text = node.text
    }
    if (node.attrs && typeof node.attrs === 'object') {
      const a = node.attrs as Record<string, unknown>,
        attrs: NonNullable<DocumentNode['attrs']> = {}
      if (['paragraph', 'heading'].includes(type) && a.textAlign != null) {
        if (!['left', 'center', 'right', 'justify'].includes(String(a.textAlign)))
          throw new Error('Invalid alignment.')
        attrs.textAlign = String(a.textAlign)
      }
      if (type === 'heading') {
        if (![1, 2, 3].includes(Number(a.level))) throw new Error('Unsupported heading level.')
        attrs.level = Number(a.level)
      }
      if (type === 'orderedList')
        attrs.start = z
          .number()
          .int()
          .min(1)
          .max(999)
          .parse(a.start ?? 1)
      if (['tableCell', 'tableHeader'].includes(type)) {
        attrs.colspan = z
          .number()
          .int()
          .min(1)
          .max(20)
          .parse(a.colspan ?? 1)
        attrs.rowspan = z
          .number()
          .int()
          .min(1)
          .max(100)
          .parse(a.rowspan ?? 1)
        if (a.colwidth != null)
          attrs.colwidth = z.array(z.number().int().min(20).max(1000)).max(20).parse(a.colwidth)
      }
      if (type === 'doc') {
        if (a.margins != null)
          attrs.margins = z.array(z.number().min(0).max(144)).length(4).parse(a.margins)
        if (a.lineHeight != null) attrs.lineHeight = z.number().min(0.8).max(3).parse(a.lineHeight)
        if (a.blockSpacing != null)
          attrs.blockSpacing = z.number().min(0).max(48).parse(a.blockSpacing)
        if (a.listIndent != null) attrs.listIndent = z.number().min(0).max(144).parse(a.listIndent)
        if (a.fontSize != null) attrs.fontSize = z.number().min(6).max(36).parse(a.fontSize)
        if (a.paragraphSpacing != null)
          attrs.paragraphSpacing = z.number().min(0).max(48).parse(a.paragraphSpacing)
      }
      if (Object.keys(attrs).length) out.attrs = attrs
    }
    if (type === 'heading' && !out.attrs?.level) out.attrs = { ...out.attrs, level: 1 }
    if (node.marks !== undefined) {
      if (
        !Array.isArray(node.marks) ||
        node.marks.length > 8 ||
        !['text', 'hardBreak'].includes(type)
      )
        throw new Error('Invalid text formatting.')
      out.marks = node.marks.map((raw: unknown) => {
        if (!raw || typeof raw !== 'object') throw new Error('Invalid text formatting.')
        const mark = raw as Record<string, unknown>,
          kind = String(mark.type)
        if (
          ![
            'bold',
            'italic',
            'underline',
            'strike',
            'subscript',
            'superscript',
            'link',
            'textStyle',
          ].includes(kind)
        )
          throw new Error('Unsupported formatting.')
        const attrs = (mark.attrs ?? {}) as Record<string, unknown>
        if (kind === 'link') {
          if (typeof attrs.href !== 'string' || attrs.href.length > 2000 || !safeLink(attrs.href))
            throw new Error('Use an https, http, or mailto link.')
          return { type: kind, attrs: { href: attrs.href } }
        }
        if (kind === 'textStyle') {
          const clean: Record<string, string> = {}
          if (attrs.fontFamily != null)
            clean.fontFamily = z
              .enum(['Arial', 'Georgia', 'Times New Roman', 'Verdana'])
              .parse(attrs.fontFamily)
          if (attrs.fontSize != null)
            clean.fontSize = z
              .string()
              .regex(/^(8|9|10|11|12|14|16|18|20|24|28|32|36)pt$/)
              .parse(attrs.fontSize)
          for (const key of ['color', 'backgroundColor'])
            if (attrs[key] != null)
              clean[key] = z
                .string()
                .regex(/^#[0-9a-fA-F]{6}$/)
                .parse(attrs[key])
          return { type: kind, attrs: clean }
        }
        return { type: kind }
      })
    }
    if (node.content !== undefined) {
      if (!Array.isArray(node.content) || node.content.length > 2000)
        throw new Error('Invalid document children.')
      out.content = node.content.map((child) => visit(child, depth + 1))
      if (out.content.some((child) => !children[type].includes(child.type)))
        throw new Error('Invalid document structure.')
    }
    if (
      [
        'doc',
        'listItem',
        'tableCell',
        'tableHeader',
        'table',
        'tableRow',
        'bulletList',
        'orderedList',
        'blockquote',
      ].includes(type) &&
      !out.content?.length
    )
      throw new Error('Document structure cannot be empty.')
    if (
      ['listItem', 'tableCell', 'tableHeader'].includes(type) &&
      out.content?.[0]?.type !== 'paragraph'
    )
      throw new Error('List items and table cells must start with a paragraph.')
    if (
      type === 'entryLine' &&
      (out.content?.length !== 2 ||
        out.content[0].type !== 'entryStart' ||
        out.content[1].type !== 'entryEnd')
    )
      throw new Error('A dated line needs a left and a right part.')
    if (type === 'tableRow' && (out.content?.length ?? 0) > 20)
      throw new Error('Tables support up to 20 columns.')
    return out
  }
  const result = visit(input, 0)
  if (result.type !== 'doc') throw new Error('A document root is required.')
  return result
}
export const documentSchema = z.unknown().transform((input, ctx) => {
  try {
    return parseDocument(input)
  } catch (error) {
    ctx.addIssue({
      code: 'custom',
      message: error instanceof Error ? error.message : 'Invalid document.',
    })
    return z.NEVER
  }
})
export function textDocument(text: string): DocumentNode {
  return {
    type: 'doc',
    content: text.split('\n').map((line) => ({
      type: 'paragraph',
      ...(line ? { content: [{ type: 'text', text: line }] } : {}),
    })),
  }
}
export function documentText(node: DocumentNode): string {
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'hardBreak') return '\n'
  const separator = ['paragraph', 'heading', 'entryStart', 'entryEnd'].includes(node.type)
    ? ''
    : ['tableRow', 'entryLine'].includes(node.type)
      ? '\t'
      : '\n'
  return (node.content ?? []).map(documentText).join(separator)
}
const escape = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
export function documentHTML(document: DocumentNode): string {
  function render(node: DocumentNode): string {
    if (node.type === 'text') {
      let value = escape(node.text ?? '')
      for (const mark of node.marks ?? []) {
        const tag = (
          {
            bold: 'strong',
            italic: 'em',
            underline: 'u',
            strike: 's',
            subscript: 'sub',
            superscript: 'sup',
          } as Record<string, string>
        )[mark.type]
        if (tag) value = `<${tag}>${value}</${tag}>`
        if (mark.type === 'link') value = `<a href="${escape(mark.attrs?.href ?? '')}">${value}</a>`
        if (mark.type === 'textStyle') {
          const style = Object.entries(mark.attrs ?? {})
            .filter(([, v]) => v != null)
            .map(
              ([k, v]) =>
                `${({ fontFamily: 'font-family', fontSize: 'font-size', color: 'color', backgroundColor: 'background-color' } as Record<string, string>)[k]}:${escape(v ?? '')}`,
            )
            .join(';')
          value = `<span style="${style}">${value}</span>`
        }
      }
      return value
    }
    if (node.type === 'hardBreak') return '<br>'
    if (node.type === 'pageBreak') return '<div class="page-break"></div>'
    if (node.type === 'horizontalRule') return '<hr>'
    const inner = (node.content ?? []).map(render).join('')
    if (node.type === 'entryLine') return `<div class="entry-line">${inner}</div>`
    if (node.type === 'entryStart') return `<span class="entry-start">${inner}</span>`
    if (node.type === 'entryEnd') return `<span class="entry-end">${inner}</span>`
    if (node.type === 'doc') return inner
    const tag =
      node.type === 'heading'
        ? `h${node.attrs?.level ?? 1}`
        : (
            {
              paragraph: 'p',
              bulletList: 'ul',
              orderedList: 'ol',
              listItem: 'li',
              blockquote: 'blockquote',
              table: 'table',
              tableRow: 'tr',
              tableCell: 'td',
              tableHeader: 'th',
            } as Record<string, string>
          )[node.type]
    const attributes = `${node.attrs?.textAlign ? ` style="text-align:${node.attrs.textAlign}"` : ''}${node.type === 'orderedList' ? ` start="${node.attrs?.start ?? 1}"` : ''}${['tableCell', 'tableHeader'].includes(node.type) ? ` colspan="${node.attrs?.colspan ?? 1}" rowspan="${node.attrs?.rowspan ?? 1}"` : ''}`
    return `<${tag}${attributes}>${inner || (node.type === 'paragraph' ? '<br>' : '')}</${tag}>`
  }
  return render(parseDocument(document))
}
