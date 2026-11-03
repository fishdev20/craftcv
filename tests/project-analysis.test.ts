import { afterEach, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { collectProjectContext } from '../src/main/scanning/project-context'
import type { Project } from '../src/shared/contracts'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

it('collects bounded high-signal context across services without absolute paths', async () => {
  const root = await mkdtemp(join(tmpdir(), 'craftcv-project-'))
  directories.push(root)
  const repositories = []
  for (const name of ['api', 'web']) {
    const path = join(root, name)
    await mkdir(path)
    execFileSync('git', ['init', '-q', path])
    await writeFile(join(path, 'README.md'), `${name} service documentation`)
    await writeFile(join(path, 'package.json'), JSON.stringify({ name }))
    await writeFile(join(path, 'source.ts'), 'const ordinarySource = true')
    repositories.push({ id: crypto.randomUUID(), name, path, projectId: 'project' })
  }
  const project: Project = {
    id: 'project',
    name: 'Kaira',
    rootPath: root,
    repositories,
    analysis: null,
  }
  const context = await collectProjectContext(project, new AbortController().signal)
  expect(context.services.map((service) => service.name)).toEqual(['api', 'web'])
  expect(context.documents.map((document) => document.path)).not.toContain('source.ts')
  expect(JSON.stringify(context)).not.toContain(root)
  expect(context.documents.length).toBe(4)
})
