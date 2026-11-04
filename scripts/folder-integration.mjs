import { _electron as electron, expect } from '@playwright/test'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const temporary = await mkdtemp(join(tmpdir(), 'craftcv-folder-')),
  folder = join(temporary, 'kaira')
for (const name of ['auth', 'billing', 'api', 'web', 'notifications', 'orders']) {
  const path = join(folder, 'services', name)
  await mkdir(path, { recursive: true })
  execFileSync('git', ['init', '-q', path])
  await writeFile(
    join(path, 'app.tsx'),
    'import React from "react"\nexport const App = () => <main>Hello</main>',
  )
}
const env = { ...process.env, CRAFTCV_TEST_DATA: join(temporary, 'data') }
delete env.ELECTRON_RUN_AS_NODE
const executable = process.env.CRAFTCV_EXECUTABLE
const app = await electron.launch({
  ...(executable ? { executablePath: executable, args: [] } : { args: [resolve('.')] }),
  env,
})
try {
  const page = await app.firstWindow()
  await page.getByRole('button', { name: 'Skip' }).click()
  // through the wizard to its projects step, with a blank CV
  await page.getByRole('tab', { name: /Paste the text/ }).click()
  await page
    .getByLabel('Target job description')
    .fill('Looking for a React developer with JavaScript experience across microservices.')
  await page.getByRole('button', { name: 'Analyse the job' }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('button', { name: /Start a blank one/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await app.evaluate(({ dialog }, path) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  }, folder)
  await page.getByRole('button', { name: 'Import project folder', exact: true }).click()
  await expect(page.getByText('1/10 selected', { exact: true })).toBeVisible()
  await expect(page.locator('.project-choice small')).toContainText('6 services')
  await page.getByRole('button', { name: 'Import project folder', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toContainText('0 repositories added')
  const data = await page.evaluate(() => window.craftcv.dashboard())
  if (!data.ok || data.value.repositories.length !== 6)
    throw new Error('Folder imports were not deduplicated')
  if (data.value.projects.length !== 1 || data.value.projects[0].repositories.length !== 6)
    throw new Error('Services were not grouped into one project')
  await page.getByRole('button', { name: 'Analyze selected projects', exact: true }).click()
  await expect(page.getByText('Supporting evidence', { exact: true }).first()).toBeVisible()
  const dashboard = await page.evaluate(() => window.craftcv.dashboard())
  const session = await page.evaluate(
    (id) => window.craftcv.getSession(id),
    dashboard.value.sessions[0].id,
  )
  if (!session.ok || session.value.stats.files !== 6)
    throw new Error('Not all six selected services were analyzed')
  if (new Set(session.value.evidence.map((e) => e.repositoryId)).size !== 6)
    throw new Error('Missing service evidence')
  if (
    session.value.evidence
      .slice(0, 6)
      .some((e) => !e.repositoryName?.startsWith('kaira / services/'))
  )
    throw new Error('Missing source labels')
  await page.getByText('Supporting evidence', { exact: true }).first().click()
  await expect(page.locator('.evidence code').first()).toContainText('kaira / services/')
  console.log(
    'Folder integration passed: native folder selection, six services discovered and selected, duplicate import, analysis of all services, labeled evidence.',
  )
} finally {
  await app.close()
  await rm(temporary, { recursive: true, force: true })
}
