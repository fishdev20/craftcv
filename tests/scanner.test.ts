import { afterEach, describe, it, expect } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { scan, safeCandidate, limits, gitRoot } from '../src/main/scanning/scanner'
const dirs: string[] = []
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'craftcv-test-'))
  dirs.push(dir)
  const root = join(dir, 'repo')
  await mkdir(root)
  execFileSync('git', ['init', '-q', root])
  return {
    dir,
    root,
    repository: { id: 'test', name: 'fixture', path: await gitRoot(root), projectId: 'project' },
  }
}
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })))
})
describe('bounded read-only scanner', () => {
  it('respects ignored tracked files, skips secrets, binaries, oversized files and symlinks', async () => {
    const { dir, root, repository } = await fixture()
    await writeFile(join(root, 'app.tsx'), 'import React from "react"\nconst name: string = "test"')
    await writeFile(join(root, 'tracked.ts'), 'const secret = "ignored"')
    execFileSync('git', ['-C', root, 'add', 'tracked.ts'])
    await writeFile(join(root, '.gitignore'), 'ignored.ts\ntracked.ts\n')
    await writeFile(join(root, 'ignored.ts'), 'import React from "react"')
    await writeFile(join(root, '.env'), 'TOKEN=secret')
    await writeFile(join(root, 'binary.ts'), 'hello\0world')
    await writeFile(join(root, 'huge.ts'), 'x'.repeat(limits.fileBytes + 1))
    await writeFile(join(dir, 'outside.ts'), 'import React from "react"')
    await symlink(join(dir, 'outside.ts'), join(root, 'linked.ts'))
    const result = await scan(repository, join(dir, 'cache'), () => {})
    expect(new Set(result.evidence.map((e) => e.path))).toEqual(new Set(['app.tsx']))
    expect(result.stats.files).toBe(1)
    const second = await scan(repository, join(dir, 'cache'), () => {})
    expect(second.stats.cached).toBe(1)
    await writeFile(join(root, 'app.tsx'), 'import React from "react"\nconst changed: number = 42')
    const third = await scan(repository, join(dir, 'cache'), () => {})
    expect(third.stats.cached).toBe(0)
    expect(third.evidence[0].hash).not.toBe(result.evidence[0].hash)
  })
  it('supports cancellation and excludes unsafe candidates', async () => {
    const { dir, repository } = await fixture()
    const controller = new AbortController()
    controller.abort()
    await expect(
      scan(repository, join(dir, 'cache'), () => {}, controller.signal),
    ).rejects.toThrow()
    for (const path of [
      '../outside.ts',
      '/etc/passwd',
      'node_modules/app.ts',
      'src/key.secret.json',
      'dist/app.js',
      'pnpm-lock.yaml',
    ])
      expect(safeCandidate(path)).toBe(false)
  })
})
it('returns an honest empty analysis for an empty repository', async () => {
  const { dir, repository } = await fixture()
  const result = await scan(repository, join(dir, 'cache'), () => {})
  expect(result.evidence).toEqual([])
  expect(result.stats.files).toBe(0)
})
it('caps scanned bytes and marks partial coverage', async () => {
  const { dir, root, repository } = await fixture()
  const content = 'const name: string = "value"\n' + ' '.repeat(120000)
  for (let i = 0; i < 110; i++) await writeFile(join(root, `source-${i}.ts`), content)
  const result = await scan(repository, join(dir, 'cache'), () => {})
  expect(result.stats.bytes).toBeLessThanOrEqual(limits.bytes)
  expect(result.stats.capped).toBe(true)
  expect(result.stats.files).toBeLessThan(110)
})
