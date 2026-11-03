import { parentPort, workerData } from 'node:worker_threads'
import { readFile, writeFile, stat } from 'node:fs/promises'
import { extname } from 'node:path'
import type { DocumentNode } from '../../shared/document'
import type { DocumentTask as Task } from './document-task'
import type { PdfPage, PdfText } from './pdf-layout'

type Matrix = [number, number, number, number, number, number]
const multiply = (m: Matrix, n: Matrix): Matrix => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
]

/** The heights of full-width thin lines drawn on the page, which CVs use to divide sections. */
function dividerRules(
  list: { fnArray: number[]; argsArray: unknown[] },
  ops: Record<string, number>,
  width: number,
): number[] {
  const paints = [ops.stroke, ops.closeStroke, ops.fill, ops.eoFill, ops.fillStroke]
  const rules: number[] = [],
    stack: Matrix[] = []
  let ctm: Matrix = [1, 0, 0, 1, 0, 0]
  list.fnArray.forEach((fn, index) => {
    const args = list.argsArray[index] as unknown[] | null
    if (fn === ops.save) stack.push(ctm)
    else if (fn === ops.restore) ctm = stack.pop() ?? ctm
    else if (fn === ops.transform && args?.length === 6) ctm = multiply(ctm, args as Matrix)
    else if (fn === ops.constructPath && args && paints.includes(args[0] as number)) {
      // pdf.js gives each path's bounding box as its third argument
      const box = args[2] as ArrayLike<number> | undefined
      if (!box || box.length !== 4) return
      const xs = [box[0], box[2]].map((x, i) => ctm[0] * x + ctm[2] * [box[1], box[3]][i] + ctm[4])
      const ys = [box[0], box[2]].map((x, i) => ctm[1] * x + ctm[3] * [box[1], box[3]][i] + ctm[5])
      if (Math.abs(ys[0] - ys[1]) <= 3 && Math.abs(xs[0] - xs[1]) >= width * 0.6)
        rules.push((ys[0] + ys[1]) / 2)
    }
  })
  return rules
}

async function readPdf(buffer: Buffer): Promise<{ text: string; document: DocumentNode | null }> {
  const { getDocument, OPS } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const { pdfDocument } = await import('./pdf-layout')
  const loading = getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    // keeps font names, which say whether text is bold or italic
    fontExtraProperties: true,
  })
  try {
    const doc = await loading.promise
    if (doc.numPages > 50) throw new Error('Please choose a CV with at most 50 pages.')
    const pages: PdfPage[] = []
    let text = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i),
        content = await page.getTextContent(),
        { width, height } = page.getViewport({ scale: 1 })
      // loads the page's fonts, and gives the drawing operations that hold divider lines
      const operations = await page.getOperatorList()
      const fontNames = new Map<string, string>()
      const fontName = (id: string) => {
        if (!fontNames.has(id)) {
          let name = ''
          try {
            name = String((page.commonObjs.get(id) as { name?: string }).name ?? '')
          } catch {
            // a font not loaded yet is treated as regular
          }
          fontNames.set(id, name.replace(/^[A-Z]{6}\+/, ''))
        }
        return fontNames.get(id)!
      }
      const texts: PdfText[] = []
      for (const item of content.items) {
        if (!('str' in item)) continue
        text += item.str + (item.hasEOL ? '\n' : '')
        const [a, b, c, d, x, y] = item.transform as number[]
        const name = fontName(item.fontName)
        texts.push({
          text: item.str,
          x,
          y,
          width: item.width,
          size: item.height || Math.hypot(c, d) || Math.hypot(a, b),
          bold: /bold|black|heavy|semibold|demi/i.test(name),
          italic: /italic|oblique/i.test(name),
        })
      }
      text += '\n'
      const links = (await page.getAnnotations())
        .filter((note) => note.subtype === 'Link' && typeof note.url === 'string')
        .map((note) => ({
          url: note.url as string,
          rect: note.rect as PdfPage['links'][0]['rect'],
        }))
      pages.push({ width, height, texts, links, rules: dividerRules(operations, OPS, width) })
      page.cleanup()
      if (text.length > 100000) throw new Error('Extracted CV exceeds 100,000 characters.')
    }
    return { text, document: pdfDocument(pages) }
  } finally {
    await loading.destroy()
  }
}

async function run(task: Task): Promise<{ text: string; document?: DocumentNode | null }> {
  if (task.kind === 'richDocx') {
    const { Packer } = await import('docx')
    const { toWordDocument } = await import('./document-docx')
    await writeFile(task.path, await Packer.toBuffer(toWordDocument(task.document)))
    return { text: '' }
  }
  if (task.kind === 'docx') {
    const { Document, Packer, Paragraph, TextRun } = await import('docx')
    const doc = new Document({
      sections: [
        {
          children: task.text.split('\n').map(
            (line) =>
              new Paragraph({
                children: [new TextRun({ text: line, font: 'Arial', size: 22 })],
                spacing: { after: 120 },
              }),
          ),
        },
      ],
    })
    await writeFile(task.path, await Packer.toBuffer(doc))
    return { text: '' }
  }
  if ((await stat(task.path)).size > 10 * 1024 * 1024)
    throw new Error('Please choose a CV smaller than 10 MB.')
  const buffer = await readFile(task.path)
  let text: string,
    document: DocumentNode | null = null
  switch (extname(task.path).toLowerCase()) {
    case '.pdf':
      ;({ text, document } = await readPdf(buffer))
      break
    case '.docx': {
      const mammoth = await import('mammoth')
      text = (await mammoth.extractRawText({ buffer })).value
      break
    }
    case '.md':
    case '.markdown':
    case '.txt':
      text = buffer.toString('utf8')
      break
    default:
      throw new Error('Choose PDF, DOCX, Markdown, or plain text.')
  }
  if (!text.trim()) throw new Error('No text was found. Scanned PDFs need OCR before import.')
  if (text.length > 100000) throw new Error('The CV exceeds the 100,000 character limit.')
  return { text: text.trim(), document }
}
run(workerData as Task)
  .then((result) => parentPort?.postMessage({ ok: true, ...result }))
  .catch((error: unknown) =>
    parentPort?.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : 'Document processing failed.',
    }),
  )
