import { lstat, opendir, realpath } from 'node:fs/promises'
import { basename, isAbsolute, join, relative } from 'node:path'
import { gitRoot } from './scanner'
import type { Progress } from '../../shared/contracts'

export const discoveryLimits = { directories: 3000, entries: 20000, depth: 6, repositories: 100 }
const excluded = new Set([
  'node_modules',
  'vendor',
  'dist',
  'build',
  'out',
  'coverage',
  'target',
  '__pycache__',
  'venv',
])
type DiscoveredRepositories = {
  folder: string
  repositories: { path: string; name: string }[]
  limited: boolean
  unreadable: number
}
/** Discover Git roots without reading source files or following directory symlinks. */
export async function discoverRepositories(
  folder: string,
  signal: AbortSignal,
  report: (progress: Progress) => void,
): Promise<DiscoveredRepositories> {
  const root = await realpath(folder)
  const result: DiscoveredRepositories = {
    folder: root,
    repositories: [],
    limited: false,
    unreadable: 0,
  }
  const queue = [{ path: root, depth: 0 }],
    found = new Set<string>()
  let directories = 0,
    entries = 0
  for (let cursor = 0; cursor < queue.length; cursor++) {
    signal.throwIfAborted()
    if (
      directories >= discoveryLimits.directories ||
      entries >= discoveryLimits.entries ||
      found.size >= discoveryLimits.repositories
    ) {
      result.limited = true
      break
    }
    const current = queue[cursor]
    try {
      const metadata = await lstat(current.path),
        resolved = await realpath(current.path),
        rel = relative(root, resolved)
      if (
        !metadata.isDirectory() ||
        metadata.isSymbolicLink() ||
        rel === '..' ||
        rel.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')) ||
        isAbsolute(rel)
      )
        continue
      directories++
      report({ phase: `Finding services in ${basename(root)}`, files: directories, total: 0 })
      try {
        const marker = await lstat(join(current.path, '.git'))
        if (!marker.isSymbolicLink() && (marker.isDirectory() || marker.isFile())) {
          const git = await gitRoot(current.path, signal)
          signal.throwIfAborted()
          if (git === resolved && !found.has(git)) {
            found.add(git)
            result.repositories.push({
              path: git,
              name: rel ? `${basename(root)} / ${rel.split('\\').join('/')}` : basename(root),
            })
          }
        }
      } catch (error) {
        if (signal.aborted) throw error
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') result.unreadable++
      }
      const handle = await opendir(current.path)
      for await (const entry of handle) {
        signal.throwIfAborted()
        if (++entries >= discoveryLimits.entries) {
          result.limited = true
          break
        }
        if (
          !entry.isDirectory() ||
          entry.isSymbolicLink() ||
          entry.name.startsWith('.') ||
          excluded.has(entry.name)
        )
          continue
        if (current.depth >= discoveryLimits.depth || queue.length >= discoveryLimits.directories) {
          result.limited = true
          continue
        }
        queue.push({ path: join(current.path, entry.name), depth: current.depth + 1 })
      }
    } catch (error) {
      if (signal.aborted) throw error
      result.unreadable++
    }
  }
  result.repositories.sort((a, b) => a.name.localeCompare(b.name))
  return result
}
