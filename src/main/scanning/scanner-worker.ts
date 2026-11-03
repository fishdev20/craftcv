import { parentPort, workerData } from 'node:worker_threads'
import { scan } from './scanner'
import type { Repository } from '../../shared/contracts'
const { repository, cacheDir } = workerData as { repository: Repository; cacheDir: string }
scan(repository, cacheDir, (progress) => parentPort?.postMessage({ type: 'progress', progress }))
  .then((result) => parentPort?.postMessage({ type: 'done', result }))
  .catch((error: unknown) =>
    parentPort?.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Scan failed',
    }),
  )
