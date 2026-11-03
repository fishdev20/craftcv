import { safeLink, type DocumentMark, type DocumentNode } from '../../shared/document'

/** A piece of text pdf.js placed on a page, in PDF points with y growing upwards. */
export type PdfText = {
  text: string
  x: number
  y: number
  width: number
  size: number
  bold: boolean
  italic: boolean
  /** The editor font it is set in, when it is one besides Arial. */
  family?: string | null
}
type PdfLink = { url: string; rect: [number, number, number, number] }
/** One page's size, text, links, and the heights of its full-width divider lines. */
export type PdfPage = {
  width: number
  height: number
  texts: PdfText[]
  links: PdfLink[]
  rules: number[]
}

type Run = {
  text: string
  bold: boolean
  italic: boolean
  href: string | null
  size: number
  family: string | null
}
type Line = {
  page: number
  y: number
  x0: number
  x1: number
  size: number
  runs: Run[]
  /** Where the words start: after the glyph on a bullet line. */
  textX0: number
  bullet: boolean
  /** Its middle is the page's middle: centred, or simply as wide as the text column. */
  balanced: boolean
  /** Text far apart on one line, like a right-aligned date; never part of a wrapped paragraph. */
  columns: boolean
}
/** A block of the document, after `blanks` empty lines. */
type Block =
  | { kind: 'paragraph' | 'item'; lines: Line[]; blanks: number }
  | { kind: 'heading'; lines: Line[]; level: number; blanks: number }
  | { kind: 'rule'; blanks: number }
  | { kind: 'break'; blanks: number }

const BULLET = /^\s*([●•▪◦‣■□➢►–]|[-*](?=\s))\s*/

/** Spacing between runs, set like the run before it. */
const plain = (text: string, like?: Run): Run => ({
  text,
  bold: false,
  italic: false,
  href: null,
  size: like?.size ?? 0,
  family: like?.family ?? null,
})

function linkAt(links: PdfLink[], text: PdfText): string | null {
  const x = text.x + text.width / 2,
    y = text.y + text.size * 0.3
  const link = links.find(
    ({ rect: [x0, y0, x1, y1] }) => x >= x0 - 1 && x <= x1 + 1 && y >= y0 - 2 && y <= y1 + 2,
  )
  return link && safeLink(link.url) ? link.url : null
}

/** The page's text as lines, each a row of styled runs in reading order. */
function pageLines(page: PdfPage, index: number): Line[] {
  const texts = page.texts.filter((text) => text.text).sort((a, b) => b.y - a.y || a.x - b.x)
  const rows: PdfText[][] = []
  for (const text of texts) {
    const row = rows.at(-1),
      size = Math.max(text.size, row?.[0].size ?? 0, 1)
    if (row && Math.abs(row[0].y - text.y) <= size * 0.4) row.push(text)
    else rows.push([text])
  }
  return rows.flatMap((row) => {
    row.sort((a, b) => a.x - b.x)
    const words = row.filter((text) => text.text.trim())
    if (!words.length) return []
    const size = Math.max(...words.map((text) => text.size))
    const runs: Run[] = []
    let end: number | null = null,
      space = false,
      columns = false
    for (const text of row) {
      if (!text.text.trim()) {
        space = end !== null
        continue
      }
      const last = runs.at(-1)?.text ?? ''
      if (end !== null) {
        const gap = text.x - end
        if (gap > size * 3) {
          columns = true
          runs.push(
            plain(/\|\s*$/.test(last) || /^\s*\|/.test(text.text) ? ' ' : ' | ', runs.at(-1)),
          )
        } else if ((space || gap > size * 0.15) && !/\s$/.test(last) && !/^\s/.test(text.text))
          runs.push(plain(' ', runs.at(-1)))
      }
      runs.push({
        text: text.text,
        bold: text.bold,
        italic: text.italic,
        href: linkAt(page.links, text),
        size: text.size,
        family: text.family ?? null,
      })
      end = text.x + text.width
      space = false
    }
    const bullet = BULLET.test(runs[0].text)
    if (bullet) {
      runs[0] = { ...runs[0], text: runs[0].text.replace(BULLET, '') }
      while (runs.length && !runs[0].text.trim()) runs.shift()
      if (!runs.length) return []
    }
    const x0 = words[0].x,
      x1 = Math.max(...words.map((text) => text.x + text.width))
    // a glyph set as its own piece puts the words at the next piece
    const textX0 = bullet && !words[0].text.replace(BULLET, '').trim() ? (words[1]?.x ?? x0) : x0
    return [
      {
        page: index,
        y: row[0].y,
        x0,
        x1,
        size,
        runs,
        textX0,
        bullet,
        balanced: Math.abs((x0 + x1) / 2 - page.width / 2) < Math.max(6, size * 0.6),
        columns,
      },
    ]
  })
}

const lineText = (line: Line) => line.runs.map((run) => run.text).join('')

/** The size most of the text is set in, which headings are larger than. */
function bodySize(lines: Line[]): number {
  const weight = new Map<number, number>()
  for (const line of lines) {
    const size = Math.round(line.size * 2) / 2
    weight.set(size, (weight.get(size) ?? 0) + lineText(line).length)
  }
  return [...weight].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 11
}

/** The editor's font sizes; text is set in the nearest, and the body size needs no mark. */
const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36]
const fontSize = (size: number) =>
  SIZES.reduce((best, option) => (Math.abs(option - size) < Math.abs(best - size) ? option : best))

/** Text runs as editor text nodes: neighbours with the same style joined, headings unbolded. */
function textNodes(runs: Run[], heading: boolean, base: number): DocumentNode[] {
  const merged: Run[] = []
  for (const run of runs) {
    const last = merged.at(-1)
    if (
      last &&
      last.bold === run.bold &&
      last.italic === run.italic &&
      last.href === run.href &&
      fontSize(last.size) === fontSize(run.size) &&
      last.family === run.family
    )
      last.text += run.text
    else merged.push({ ...run })
  }
  return merged
    .filter((run) => run.text)
    .map((run) => {
      const size = fontSize(run.size)
      const style = {
        ...(size !== base && { fontSize: `${size}pt` }),
        ...(run.family && { fontFamily: run.family }),
      }
      const marks: DocumentMark[] = [
        ...(run.bold && !heading ? [{ type: 'bold' }] : []),
        ...(run.italic ? [{ type: 'italic' }] : []),
        ...(run.href ? [{ type: 'link', attrs: { href: run.href } }] : []),
        ...(Object.keys(style).length ? [{ type: 'textStyle', attrs: style }] : []),
      ]
      return { type: 'text', text: run.text, ...(marks.length && { marks }) }
    })
}

/** A block's lines as one run of text: wrapped lines joined with a space. */
function blockRuns(lines: Line[]): Run[] {
  const runs = lines.flatMap((line, index) =>
    index ? [plain(' ', lines[index - 1].runs.at(-1)), ...line.runs] : line.runs,
  )
  if (runs.length) {
    runs[0] = { ...runs[0], text: runs[0].text.trimStart() }
    runs[runs.length - 1] = { ...runs.at(-1)!, text: runs.at(-1)!.text.trimEnd() }
  }
  return runs
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null
}
const round = (value: number, places = 1) => Math.round(value * 10 ** places) / 10 ** places
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

// Arial's ascent and descent as fractions of its size; how far a line box reaches above and
// below the baseline is these plus half the extra line spacing
const ASCENT = 0.905,
  DESCENT = 0.212

/**
 * Rebuilds a PDF's layout as an editor document from where pdf.js placed its text: lines
 * from positions, wrapped lines joined into paragraphs and list items, larger bold lines as
 * headings, centred lines, text sizes, bold, italic, links, full-width divider lines, blank
 * lines for vertical gaps, a page break where each page ends, and the page's margins, line
 * spacing and list indent, so the document fills its pages as the PDF does.
 */
export function pdfDocument(pages: PdfPage[]): DocumentNode | null {
  const left = Math.min(
    ...pages.flatMap((page) => page.texts.filter((t) => t.text.trim()).map((t) => t.x)),
  )
  const lines = pages.flatMap((page, index) => pageLines(page, index))
  if (!lines.length) return null
  const right = Math.max(...lines.map((line) => line.x1)),
    body = bodySize(lines)
  // indented on both sides, not merely as wide as the text column
  const centered = (line: Line) =>
    line.balanced &&
    line.x0 > left + line.size * 2 &&
    line.x1 - line.x0 < right - left - line.size * 4
  const bold = (line: Line) => line.runs.every((run) => run.bold || !run.text.trim())
  const larger = (line: Line) =>
    line.size > body * 1.08 && bold(line) && lineText(line).length < 120
  // a section title set in capitals at the body size, like EDUCATION
  const capitals = (line: Line) => {
    const text = lineText(line)
    return bold(line) && text.length <= 40 && /[A-Z]{3}/.test(text) && text === text.toUpperCase()
  }
  const headingSizes = [...new Set(lines.filter(larger).map((line) => line.size))].sort(
    (a, b) => b - a,
  )
  // capitals take the level of the smallest larger heading, as section titles usually are
  const headingLevel = (line: Line) =>
    larger(line)
      ? Math.min(headingSizes.indexOf(line.size) + 1, 3)
      : Math.min(headingSizes.length || 2, 3)

  // line spacing: how far apart the baselines of a paragraph's lines are, for their size
  const spacing =
    median(
      lines.flatMap((line, index) => {
        const next = lines[index + 1]
        if (!next || next.page !== line.page || Math.abs(next.size - line.size) > 0.5) return []
        const ratio = (line.y - next.y) / line.size
        return ratio >= 1 && ratio <= 1.8 ? [ratio] : []
      }),
    ) ?? 1.15
  const halfLeading = (spacing - ASCENT - DESCENT) / 2
  const pageLinesOf = (index: number) => lines.filter((line) => line.page === index)
  // how far below each page's top edge its first line box starts; the least is the top margin
  const lineTops = pages.map((page, index) => {
    const first = pageLinesOf(index)[0]
    return first ? page.height - first.y - first.size * (ASCENT + halfLeading) : null
  })
  const top = clamp(Math.min(...lineTops.filter((value) => value !== null)), 0, 144)

  // lines and divider rules in reading order
  type Event = { page: number; y: number; line?: Line }
  const events: Event[] = [
    ...lines.map((line) => ({ page: line.page, y: line.y, line })),
    ...pages.flatMap((page, index) => page.rules.map((y) => ({ page: index, y }))),
  ].sort((a, b) => a.page - b.page || b.y - a.y)

  const blocks: Block[] = []
  let page = 0,
    above: Line | null = null,
    ruled = false
  /**
   * Blank lines that make up the gap above a new block beyond the usual line spacing, or, for
   * a page's first block, between the top margin and where its text starts.
   */
  const blanksBefore = (line: Line) => {
    const gap = above
      ? above.y - line.y - (spacing * (above.size + line.size)) / 2
      : (lineTops[line.page] ?? top) - top
    const blanks = Math.round(gap / (spacing * body)) - (ruled ? 1 : 0)
    return clamp(blanks, 0, 6)
  }
  for (const event of events) {
    const { line } = event
    if (event.page !== page) {
      page = event.page
      above = null
      if (blocks.length) blocks.push({ kind: 'break', blanks: 0 })
    }
    if (!line) {
      if (blocks.length && !['rule', 'break'].includes(blocks.at(-1)!.kind)) {
        blocks.push({ kind: 'rule', blanks: 0 })
        ruled = true
      }
      continue
    }
    if (!line.bullet && (larger(line) || capitals(line))) {
      blocks.push({
        kind: 'heading',
        lines: [line],
        level: headingLevel(line),
        blanks: blanksBefore(line),
      })
      above = line
      ruled = false
      continue
    }
    const current = blocks.at(-1)
    const previous = current && 'lines' in current ? current.lines.at(-1)! : null
    const near = (a: number, b: number) => Math.abs(a - b) <= line.size * 0.8
    const follows =
      previous !== null &&
      !line.bullet &&
      !line.columns &&
      !previous.columns &&
      Math.abs(line.size - previous.size) < 0.5 &&
      (line.page !== previous.page || previous.y - line.y <= previous.size * 1.75)
    const continues =
      follows &&
      (current?.kind === 'item'
        ? // a bullet's wrapped lines start where its words do
          near(line.x0, current.lines[0].textX0)
        : current?.kind === 'paragraph' &&
          // a paragraph wraps once its line is full; centred lines share only their middle
          previous.x1 >= right - previous.size * 7 &&
          (near(line.x0, current.lines[0].x0) || (previous.balanced && line.balanced)))
    if (continues && current && 'lines' in current) current.lines.push(line)
    else
      blocks.push({
        kind: line.bullet ? 'item' : 'paragraph',
        lines: [line],
        blanks: blanksBefore(line),
      })
    above = line
    ruled = false
  }
  while (['rule', 'break'].includes(blocks.at(-1)?.kind ?? '')) blocks.pop()

  const content: DocumentNode[] = []
  for (const block of blocks) {
    for (let blank = 0; blank < block.blanks; blank++) content.push({ type: 'paragraph' })
    if (block.kind === 'rule' || block.kind === 'break') {
      content.push({ type: block.kind === 'rule' ? 'horizontalRule' : 'pageBreak' })
      continue
    }
    const text = textNodes(blockRuns(block.lines), block.kind === 'heading', fontSize(body))
    if (!text.length) continue
    // a paragraph is centred when all its lines share the page's middle, not when one wrapped
    // line happens to; list items keep their bullets on the left
    const align: Record<string, string> =
      block.kind !== 'item' &&
      block.lines.every((line) => line.balanced) &&
      block.lines.some(centered)
        ? { textAlign: 'center' }
        : {}
    if (block.kind === 'heading') {
      content.push({ type: 'heading', attrs: { level: block.level, ...align }, content: text })
      continue
    }
    const paragraph: DocumentNode = {
      type: 'paragraph',
      ...(Object.keys(align).length && { attrs: align }),
      content: text,
    }
    if (block.kind === 'paragraph') {
      content.push(paragraph)
      continue
    }
    const item = { type: 'listItem', content: [paragraph] }
    const list = content.at(-1)
    if (list?.type === 'bulletList') list.content!.push(item)
    else content.push({ type: 'bulletList', content: [item] })
  }
  if (!content.length) return null

  // the margins the text sits within, and how far list text is indented from them
  const width = pages[0].width
  const bottoms = pages.slice(0, -1).flatMap((_, index) => {
    const last = pageLinesOf(index).at(-1)
    return last ? [last.y - last.size * (DESCENT + halfLeading)] : []
  })
  const items = blocks.flatMap((block) => (block.kind === 'item' ? [block.lines[0]] : []))
  return {
    type: 'doc',
    attrs: {
      margins: [
        round(top),
        round(clamp(width - right, 0, 144)),
        // a page that ends early says little; the bottom margin is at most the top one
        round(clamp(Math.min(top, ...bottoms), 0, 144)),
        round(clamp(left, 0, 144)),
      ],
      lineHeight: round(spacing, 3),
      blockSpacing: 0,
      listIndent: round(clamp(median(items.map((line) => line.textX0 - left)) ?? 24, 0, 144)),
      fontSize: fontSize(body),
    },
    content,
  }
}
