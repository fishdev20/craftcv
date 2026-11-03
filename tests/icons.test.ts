import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { it, expect } from 'vitest'
import { brandIcons, lucideIcons } from '../src/renderer/common/ui/icons'

const sources = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sources(join(dir, entry.name))
      : entry.name.endsWith('.tsx')
        ? [join(dir, entry.name)]
        : [],
  )

it('registers every Lucide icon the renderer references', () => {
  const referenced = new Set(
    sources('src/renderer').flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/lucide:([a-z0-9-]*[a-z0-9])["'`]/g)].map(
        (match) => match[1],
      ),
    ),
  )
  for (const alignment of ['left', 'center', 'right', 'justify'])
    referenced.add(`align-${alignment}`)
  const missing = [...referenced].filter((name) => !(name in lucideIcons))
  expect(missing).toEqual([])
  expect(referenced.size).toBeGreaterThan(30)
})

it('registers every brand icon the renderer references', () => {
  const missing = sources('src/renderer').flatMap((file) =>
    [...readFileSync(file, 'utf8').matchAll(/simple-icons:([a-z0-9-]+)["'`]/g)]
      .map((match) => match[1])
      .filter((name) => !(name in brandIcons)),
  )
  expect(missing).toEqual([])
})
