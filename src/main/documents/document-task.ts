import { Worker } from 'node:worker_threads'
import type { DocumentNode } from '../../shared/document'

/** Work the document worker does: parse an imported file, or write a DOCX. */
export type DocumentTask =
  | { kind: 'import'; path: string }
  | { kind: 'docx'; path: string; text: string }
  | { kind: 'richDocx'; path: string; document: DocumentNode }

/** What the worker gives back: an import's text, and its layout when the file had one to read. */
export type DocumentResult = { text: string; document?: DocumentNode | null }

/**
 * Runs one task in the document worker, with a memory cap and a 30-second limit, so a hostile
 * or huge file cannot stall or exhaust the main process.
 */
export function documentTask(
  workerFile: string,
  task: DocumentTask,
  signal: AbortSignal,
): Promise<DocumentResult> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, {
      workerData: task,
      resourceLimits: { maxOldGenerationSizeMb: 128 },
    })
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      void worker.terminate()
    }
    const abort = () => {
      finish()
      reject(new Error('Document operation cancelled.'))
    }
    const timer = setTimeout(() => {
      finish()
      reject(new Error('Document processing exceeded the 30 second limit.'))
    }, 30000)
    signal.addEventListener('abort', abort, { once: true })
    worker.on('message', (result: DocumentResult & { ok: boolean; error: string }) => {
      finish()
      if (result.ok) resolve({ text: result.text, document: result.document })
      else reject(new Error(result.error))
    })
    worker.on('error', (error) => {
      finish()
      reject(error)
    })
    worker.on('exit', (code) => {
      if (code !== 0) {
        finish()
        reject(new Error('Document worker stopped. The document may exceed resource limits.'))
      }
    })
  })
}
