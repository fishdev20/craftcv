import { _electron as electron, expect } from '@playwright/test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const temporary = await mkdtemp(join(tmpdir(), 'craftcv-benchmark-'))
const repository = join(temporary, 'benchmark-project')
await mkdir(repository)
execFileSync('git', ['init', '-q', repository])
const source =
  'import React from "react"\nexport const App = () => <main aria-label="App">Hello</main>\n' +
  '// ordinary source context\n'.repeat(200)
for (let i = 0; i < 500; i++) await writeFile(join(repository, `component-${i}.tsx`), source)
const env = { ...process.env, CRAFTCV_TEST_DATA: join(temporary, 'data') }
delete env.ELECTRON_RUN_AS_NODE
const executable = process.env.CRAFTCV_EXECUTABLE
const samples = []
try {
  for (let run = 0; run < 3; run++) {
    const started = performance.now()
    const app = await electron.launch({
      ...(executable ? { executablePath: executable, args: [] } : { args: [resolve('.')] }),
      env,
    })
    try {
      const page = await app.firstWindow()
      await expect(page.getByRole('heading', { name: 'New application' })).toBeVisible()
      const startupMs = Math.round(performance.now() - started)
      await page.waitForTimeout(1000)
      const processes = await app.evaluate(({ app }) =>
        app.getAppMetrics().map((p) => ({ type: p.type, workingSetKB: p.memory.workingSetSize })),
      )
      const sample = {
        run: run + 1,
        startupMs,
        idleWorkingSetMB: Math.round(
          processes.reduce((total, p) => total + p.workingSetKB, 0) / 1024,
        ),
        processes,
      }
      if (run === 2) {
        await app.evaluate(({ dialog }, path) => {
          dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
        }, repository)
        const picked = await page.evaluate(() => window.craftcv.selectRepository())
        if (!picked.ok || !picked.value) throw new Error('Repository selection failed')
        const runs = []
        for (let attempt = 0; attempt < 2; attempt++) {
          const result = await page.evaluate(async (projectId) => {
            let ticks = 0
            const timer = setInterval(() => ticks++, 10)
            try {
              return {
                result: await window.craftcv.analyze({
                  projectIds: [projectId],
                  job: 'React developer with accessibility and JavaScript experience.',
                  resumeId: null,
                }),
                ticks,
              }
            } finally {
              clearInterval(timer)
            }
          }, picked.value.project.id)
          if (!result.result.ok) throw new Error(result.result.error)
          runs.push({ ...result.result.value.stats, rendererTimerTicks: result.ticks })
        }
        sample.scans = runs
      }
      samples.push(sample)
    } finally {
      await app.close()
    }
  }
  await mkdir('artifacts', { recursive: true })
  const report = {
    packaged: !!executable,
    platform: process.platform,
    arch: process.arch,
    fixtureFiles: 500,
    samples,
  }
  await writeFile('artifacts/benchmark.json', JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify(report, null, 2))
} finally {
  await rm(temporary, { recursive: true, force: true })
}
