import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { lstat, realpath, open, readFile, writeFile, mkdir, rename } from 'node:fs/promises'
import { join, relative, isAbsolute, extname } from 'node:path'
import { cacheFile as cachePath } from './scan-cache'
import { extractEvidence } from '../domain/evidence'
import type { Evidence, Repository, ScanStats, Progress } from '../../shared/contracts'
const exec = promisify(execFile)
export const limits = {
  files: 1500,
  bytes: 12 * 1024 * 1024,
  fileBytes: 128 * 1024,
  entries: 10000,
}
const allowed = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.cs',
  '.cpp',
  '.c',
  '.h',
  '.sql',
  '.json',
  '.toml',
  '.yaml',
  '.yml',
  '.css',
  '.scss',
  '.md',
  '.rb',
  '.php',
  '.swift',
  '.kt',
  '.sh',
])
const excluded =
  /(^|\/)(node_modules|vendor|dist|build|out|coverage|\.git|\.next|target|__pycache__|\.venv|venv)(\/|$)|(?:lock|\.min\.[^/]+|\.map|\.generated\.[^/]+)$|(^|\/)(\.env[^/]*|.*(?:secret|credential|private[-_]?key).*|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i
export function safeCandidate(path: string): boolean {
  return (
    !excluded.test(path) &&
    (allowed.has(extname(path)) || /(^|\/)Dockerfile$/.test(path)) &&
    !path.includes('\0') &&
    !isAbsolute(path) &&
    !path.split(/[\\/]/).includes('..')
  )
}
export async function gitRoot(path: string, signal?: AbortSignal): Promise<string> {
  const { stdout } = await exec(
    'git',
    ['-c', 'core.fsmonitor=false', '-C', path, 'rev-parse', '--show-toplevel'],
    {
      signal,
      timeout: 10000,
      maxBuffer: 4096,
      windowsHide: true,
    },
  )
  return realpath(stdout.trim())
}
type Cached = { signature: string; evidence: Evidence[] }
export async function scan(
  repository: Repository,
  cacheDir: string,
  progress: (p: Progress) => void,
  signal?: AbortSignal,
): Promise<{ evidence: Evidence[]; stats: ScanStats }> {
  const started = performance.now(),
    root = await gitRoot(repository.path)
  if (root !== repository.path)
    throw new Error('The selected repository location has changed. Select it again.')
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
      '-z',
    ],
    { signal, timeout: 20000, maxBuffer: 2 * 1024 * 1024, windowsHide: true },
  )
  const all = [...new Set(stdout.split('\0').filter(Boolean))]
  const candidates = all.slice(0, limits.entries).filter(safeCandidate)
  // --no-index also excludes ignored files that have already been tracked.
  const ignored =
    candidates.length === 0
      ? new Set<string>()
      : await new Promise<Set<string>>((resolve, reject) => {
          const child = execFile(
            'git',
            [
              '-c',
              'core.fsmonitor=false',
              '-C',
              root,
              'check-ignore',
              '--no-index',
              '--stdin',
              '-z',
            ],
            { signal, timeout: 10000, maxBuffer: 2 * 1024 * 1024, windowsHide: true },
            (err, out) => {
              if (err && String(err.code) !== '1') reject(err)
              else resolve(new Set(out.split('\0').filter(Boolean)))
            },
          )
          child.stdin?.on('error', () => {})
          child.stdin?.end(candidates.join('\0') + '\0')
        })
  await mkdir(cacheDir, { recursive: true, mode: 0o700 })
  const cacheFile = cachePath(cacheDir, root)
  let previous: Record<string, Cached> = {}
  try {
    const metadata = await lstat(cacheFile)
    if (metadata.size < 24 * 1024 * 1024)
      previous = JSON.parse(await readFile(cacheFile, 'utf8')) as Record<string, Cached>
  } catch {
    /* cache misses are harmless */
  }
  const next: Record<string, Cached> = {},
    evidence: Evidence[] = []
  const stats: ScanStats = {
    files: 0,
    bytes: 0,
    cached: 0,
    skipped: all.length - candidates.length,
    capped: all.length > limits.entries,
    durationMs: 0,
  }
  for (const path of candidates) {
    signal?.throwIfAborted()
    if (stats.files >= limits.files || stats.bytes >= limits.bytes) {
      stats.capped = true
      break
    }
    if (ignored.has(path)) {
      stats.skipped++
      continue
    }
    try {
      const full = join(root, path),
        metadata = await lstat(full)
      const resolved = await realpath(full),
        rel = relative(root, resolved)
      if (
        metadata.isSymbolicLink() ||
        !metadata.isFile() ||
        rel.startsWith('..') ||
        isAbsolute(rel) ||
        metadata.size > limits.fileBytes
      ) {
        stats.skipped++
        continue
      }
      if (stats.bytes + metadata.size > limits.bytes) {
        stats.capped = true
        break
      }
      const signature = `${metadata.size}:${metadata.mtimeMs}:${metadata.ctimeMs}`
      const cached = previous[path]
      if (cached?.signature === signature) {
        next[path] = cached
        stats.cached++
        evidence.push(...cached.evidence)
      } else {
        const handle = await open(full, 'r')
        let buffer: Buffer
        try {
          const read = await handle.read(
            Buffer.alloc(limits.fileBytes + 1),
            0,
            limits.fileBytes + 1,
            0,
          )
          buffer = read.buffer.subarray(0, read.bytesRead)
        } finally {
          await handle.close()
        }
        if (buffer.length > limits.fileBytes || buffer.includes(0)) {
          stats.skipped++
          continue
        }
        const text = buffer.toString('utf8')
        if (
          /@generated|DO NOT EDIT|BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY|(?:sk-[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16})/.test(
            text,
          )
        ) {
          stats.skipped++
          continue
        }
        const extracted = extractEvidence(text, path, repository.id)
        next[path] = { signature, evidence: extracted }
        evidence.push(...extracted)
      }
      stats.files++
      stats.bytes += metadata.size
      if (stats.files % 10 === 0)
        progress({
          phase: `Reading ${repository.name}`,
          files: stats.files,
          total: Math.min(candidates.length, limits.files),
        })
    } catch (error) {
      if (signal?.aborted) throw error
      stats.skipped++
    }
  }
  await writeFile(cacheFile + '.tmp', JSON.stringify(next), { mode: 0o600 })
  await rename(cacheFile + '.tmp', cacheFile)
  stats.durationMs = Math.round(performance.now() - started)
  progress({ phase: 'Repository indexed', files: stats.files, total: stats.files })
  return { evidence, stats }
}
