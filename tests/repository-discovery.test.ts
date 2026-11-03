import { afterEach, describe, expect, it } from 'vitest'
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { discoverRepositories, discoveryLimits } from '../src/main/scanning/repository-discovery'
const temporary: string[] = []
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'craftcv-services-'))
  temporary.push(root)
  return root
}
async function git(path: string) {
  await mkdir(path, { recursive: true })
  execFileSync('git', ['init', '-q', path])
}
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})
describe('services folder discovery', () => {
  it('discovers nested Git services and skips dependencies and escaping symlinks', async () => {
    const root = await fixture(),
      parent = join(root, 'kaira')
    await git(join(parent, 'auth'))
    await git(join(parent, 'services', 'billing'))
    await git(join(parent, 'node_modules', 'dependency'))
    await git(join(root, 'external'))
    await symlink(join(root, 'external'), join(parent, 'linked'))
    const result = await discoverRepositories(parent, new AbortController().signal, () => {})
    expect(result.repositories.map((repo) => repo.name)).toEqual([
      'kaira / auth',
      'kaira / services/billing',
    ])
    expect(result.limited).toBe(false)
  })
  it('handles a monorepo and separate Git directories (worktree-style .git files)', async () => {
    const root = await fixture(),
      parent = join(root, 'omakala')
    await git(parent)
    const child = join(parent, 'service')
    await mkdir(child)
    execFileSync('git', ['init', '-q', '--separate-git-dir', join(root, 'git-metadata'), child])
    const result = await discoverRepositories(parent, new AbortController().signal, () => {})
    expect(result.repositories.map((repo) => repo.name)).toEqual(['omakala', 'omakala / service'])
  })
  it('does not mistake ordinary subdirectories for repositories or walk above the chosen folder', async () => {
    const root = await fixture()
    await git(root)
    const child = join(root, 'service')
    await mkdir(child)
    await writeFile(join(child, 'app.ts'), 'const value = 1')
    const result = await discoverRepositories(child, new AbortController().signal, () => {})
    expect(result.repositories).toEqual([])
  })
  it('reports depth limits and supports cancellation', async () => {
    const root = await fixture()
    await git(
      join(root, ...Array.from({ length: discoveryLimits.depth + 1 }, (_, i) => `level-${i}`)),
    )
    const result = await discoverRepositories(root, new AbortController().signal, () => {})
    expect(result.limited).toBe(true)
    const controller = new AbortController()
    controller.abort()
    await expect(discoverRepositories(root, controller.signal, () => {})).rejects.toThrow()
  })
})
