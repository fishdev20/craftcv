import { writeFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { dialog, type BrowserWindow } from 'electron'
import {
  documentHTML,
  layoutStyle,
  pageLayout,
  parseDocument,
  type DocumentNode,
} from '../../shared/document'
import type { Resume } from '../../shared/contracts'
import { documentTask, type DocumentResult } from './document-task'

/** Asks for a CV file and extracts its text, and its layout if any; null when cancelled. */
export async function importDocument(
  window: BrowserWindow,
  workerFile: string,
  signal: AbortSignal,
): Promise<({ name: string } & DocumentResult) | null> {
  const picked = await dialog.showOpenDialog(window, {
    properties: ['openFile'],
    filters: [{ name: 'CV documents', extensions: ['md', 'markdown', 'txt', 'pdf', 'docx'] }],
  })
  if (picked.canceled || !picked.filePaths[0]) return null
  const path = picked.filePaths[0]
  return {
    name: basename(path),
    ...(await documentTask(workerFile, { kind: 'import', path }, signal)),
  }
}
/** Saves a session's tailored resume as plain text: DOCX through the worker, PDF by printing. */
export async function exportSessionResume(
  window: BrowserWindow,
  workerFile: string,
  text: string,
  format: 'pdf' | 'docx',
  signal: AbortSignal,
): Promise<string | null> {
  const { filePath, canceled } = await dialog.showSaveDialog(window, {
    defaultPath: `CraftCV-resume.${format}`,
    filters: [{ name: format.toUpperCase(), extensions: [format] }],
  })
  if (canceled || !filePath) return null
  signal.throwIfAborted()
  if (format === 'docx')
    await documentTask(workerFile, { kind: 'docx', path: filePath, text }, signal)
  else {
    // Print text in the existing window; never create another BrowserWindow.
    await window.webContents.executeJavaScript(
      `window.dispatchEvent(new CustomEvent('craftcv-print', {detail:${JSON.stringify(text).replace(/</g, '\\u003c')}}))`,
    )
    try {
      const pdf = await window.webContents.printToPDF({
        printBackground: false,
        pageSize: 'A4',
        margins: { top: 0.6, bottom: 0.6, left: 0.6, right: 0.6 },
      })
      signal.throwIfAborted()
      await writeFile(filePath, pdf)
    } finally {
      if (!window.isDestroyed())
        await window.webContents.executeJavaScript(
          "window.dispatchEvent(new Event('craftcv-print-clear'))",
        )
    }
  }
  return filePath
}

/** Saves an edited document as DOCX (through the worker) or PDF (printed from validated HTML). */
export async function exportEditedDocument(
  window: BrowserWindow,
  workerFile: string,
  resume: Resume,
  format: 'pdf' | 'docx',
  signal: AbortSignal,
): Promise<string | null> {
  const { filePath, canceled } = await dialog.showSaveDialog(window, {
    defaultPath: `${resume.name.replace(/[<>:"/\\|?*]/g, '-').replace(/\.(pdf|docx|md|txt)$/i, '')}.${format}`,
    filters: [{ name: format.toUpperCase(), extensions: [format] }],
  })
  if (canceled || !filePath) return null
  signal.throwIfAborted()
  if (format === 'docx')
    await documentTask(
      workerFile,
      { kind: 'richDocx', path: filePath, document: resume.document },
      signal,
    )
  else await printRichDocument(window, resume.document, filePath, signal)
  return filePath
}
async function printRichDocument(
  window: BrowserWindow,
  document: DocumentNode,
  path: string,
  signal: AbortSignal,
) {
  // HTML is generated only from the main-process validated schema; renderer HTML is never accepted.
  const html = documentHTML(document)
  // the page layout prints as it shows in the editor: its margins on the page, its spacing in CSS
  const layout = pageLayout(parseDocument(document)),
    [top, right, bottom, left] = layout.margins.map((points) => points / 72)
  await window.webContents.executeJavaScript(
    `{ const el=document.getElementById('print-document'); el.innerHTML=${JSON.stringify(html).replace(/</g, '\\u003c')}; el.setAttribute('style', ${JSON.stringify(layoutStyle(layout))}); ${layout.blockSpacing === null ? '' : "el.dataset.layout='exact';"} el.classList.add('rich-document'); document.body.classList.add('printing'); }`,
  )
  try {
    const pdf = await window.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top, right, bottom, left },
    })
    signal.throwIfAborted()
    await writeFile(path, pdf)
  } finally {
    if (!window.isDestroyed())
      await window.webContents.executeJavaScript(
        "{ const el=document.getElementById('print-document'); el.classList.remove('rich-document'); el.removeAttribute('style'); delete el.dataset.layout; } window.dispatchEvent(new Event('craftcv-print-clear'))",
      )
  }
}
