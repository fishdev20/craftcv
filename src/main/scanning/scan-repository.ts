import { Worker } from 'node:worker_threads'
import type { Evidence, Progress, Repository, ScanStats } from '../../shared/contracts'

type ScanResult = { evidence: Evidence[]; stats: ScanStats }

type WorkerMessage =
  | { type: 'progress'; progress: Progress }
  | { type: 'done'; result: ScanResult }
  | { type: 'error'; error: string }

/** Scans one repository in the scanner worker, so a large repository never blocks the main process. */
export function scanRepository(
  workerFile: string,
  repository: Repository,
  cacheDir: string,
  signal: AbortSignal,
  onProgress: (progress: Progress) => void,
): Promise<ScanResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerFile, { workerData: { repository, cacheDir } })
    const abort = () => {
      void worker.terminate()
      reject(new Error('Analysis cancelled.'))
    }
    signal.addEventListener('abort', abort, { once: true })
    const cleanup = () => signal.removeEventListener('abort', abort)
    worker.on('message', (message: WorkerMessage) => {
      if (message.type === 'progress') onProgress(message.progress)
      if (message.type === 'done') {
        cleanup()
        resolve(message.result)
        void worker.terminate()
      }
      if (message.type === 'error') {
        cleanup()
        reject(new Error(message.error))
        void worker.terminate()
      }
    })
    worker.on('error', (error) => {
      cleanup()
      reject(error)
    })
    worker.on('exit', (code) => {
      cleanup()
      if (code !== 0 && !signal.aborted)
        reject(new Error('Repository worker stopped unexpectedly.'))
    })
  })
}
