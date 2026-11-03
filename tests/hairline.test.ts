import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { it, expect } from 'vitest'
import HL from '../src/renderer/common/hairline/kernel.js'
import press from '../src/renderer/common/hairline/figures/press.js'

it('keeps the vendored hairline kernel byte-identical to its published hash', () => {
  const [header, ...rest] = readFileSync('src/renderer/common/hairline/kernel.js', 'utf8').split(
    '\n',
  )
  const expected = /sha256:([0-9a-f]{64})/.exec(header)?.[1]
  expect(createHash('sha256').update(rest.join('\n')).digest('hex')).toBe(expected)
})

it('loads the Press figure as a module through the build plugin', () => {
  expect(typeof HL.inject).toBe('function')
  expect(press.name).toBe('press')
  expect(press.range).toHaveLength(3)
  expect(typeof press.mount).toBe('function')
})
