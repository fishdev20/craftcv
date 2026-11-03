import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { lstat, readFile, realpath } from 'node:fs/promises'
import { isAbsolute, join, relative } from 'node:path'
import { safeCandidate } from './scanner'
import type { Project } from '../../shared/contracts'

const exec = promisify(execFile)
const signalFiles =
  /(^|\/)(README(?:\.[^/]+)?|package\.json|pyproject\.toml|go\.mod|Cargo\.toml|pom\.xml|build\.gradle(?:\.kts)?|Dockerfile|docker-compose[^/]*\.ya?ml|Chart\.yaml|values\.ya?ml|openapi[^/]*\.ya?ml|swagger[^/]*\.ya?ml)$/i
const secret = /BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY|(?:sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})/

export type ProjectContext = {
  project: { name: string }
  services: { name: string }[]
  documents: { service: string; path: string; text: string }[]
  truncated: boolean
}

async function candidates(path: string, signal: AbortSignal): Promise<string[]> {
  const root = await realpath(path)
  const { stdout } = await exec(
    'git',
    [
      '-c',
      'core.fsmonitor=false',
      '-C',
      root,
      'ls-files',
      '--cached',
      '--others',
      '--exclude-standard',
    ],
    { signal, timeout: 15000, maxBuffer: 2 * 1024 * 1024, windowsHide: true },
  )
  return [...new Set(stdout.split('\n').filter(Boolean))]
    .filter(
      (file) =>
        signalFiles.test(file) &&
        (safeCandidate(file) ||
          (!file.includes('\0') && !isAbsolute(file) && !file.split(/[\\/]/).includes('..'))),
    )
    .sort((a, b) => {
      const readme = (value: string) => (/README/i.test(value) ? 0 : 1)
      return (
        readme(a) - readme(b) || a.split('/').length - b.split('/').length || a.localeCompare(b)
      )
    })
}

export async function collectProjectContext(
  project: Project,
  signal: AbortSignal,
): Promise<ProjectContext> {
  const queues = await Promise.all(
    project.repositories.map(async (repository) => {
      const root = await realpath(repository.path)
      return { repository, root, files: await candidates(root, signal) }
    }),
  )
  const documents: ProjectContext['documents'] = []
  let chars = 0
  for (let round = 0; round < 4 && documents.length < 48 && chars < 80000; round++) {
    for (const { repository, root, files } of queues) {
      signal.throwIfAborted()
      const path = files[round]
      if (!path || documents.length >= 48 || chars >= 80000) continue
      try {
        const full = join(root, path)
        const metadata = await lstat(full)
        const resolved = await realpath(full)
        const rel = relative(root, resolved)
        if (
          metadata.isSymbolicLink() ||
          !metadata.isFile() ||
          metadata.size > 128 * 1024 ||
          rel.startsWith('..') ||
          isAbsolute(rel)
        )
          continue
        const raw = await readFile(resolved, 'utf8')
        if (raw.includes('\0') || secret.test(raw)) continue
        const text = raw.slice(0, Math.min(4000, 80000 - chars))
        if (!text.trim()) continue
        documents.push({ service: repository.name, path, text })
        chars += text.length
      } catch (error) {
        if (signal.aborted) throw error
        // A changing or unreadable signal file does not invalidate the rest of the project.
      }
    }
  }
  return {
    project: { name: project.name },
    services: project.repositories.map(({ name }) => ({ name })),
    documents,
    truncated: queues.some(({ files }) => files.length > 4) || chars >= 80000,
  }
}
