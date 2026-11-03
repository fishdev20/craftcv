import { readdir, readFile, stat, mkdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { join } from 'node:path'
const assets = 'out/renderer/assets',
  files = await readdir(assets)
const bundles = await Promise.all(
  files
    .filter((f) => f.endsWith('.js'))
    .map(async (file) => {
      const b = await readFile(join(assets, file))
      return { file, bytes: b.length, gzipBytes: gzipSync(b).length }
    }),
)
async function size(dir) {
  let n = 0
  for (const f of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, f.name)
    if (f.isDirectory()) n += await size(p)
    else n += (await stat(p)).size
  }
  return n
}
const report = {
  bundles,
  initialGzipBytes: bundles
    .filter((b) => b.file.startsWith('index-'))
    .reduce((n, b) => n + b.gzipBytes, 0),
  productionOutputBytes: await size('out'),
}
await mkdir('artifacts', { recursive: true })
await writeFile('artifacts/bundle-metrics.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(report, null, 2))
if (report.initialGzipBytes > 500 * 1024) process.exitCode = 1
