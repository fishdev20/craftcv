import { createHash } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'

/** Where a repository's scan cache lives: one file per repository root, named by its hash. */
export const cacheFile = (cacheDir: string, root: string) =>
  join(cacheDir, `${createHash('sha256').update(root).digest('hex')}.json`)

export const removeCache = (cacheDir: string, root: string) =>
  rm(cacheFile(cacheDir, root), { force: true })
