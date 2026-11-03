import { _electron as electron, expect } from '@playwright/test'
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
const temporary = await mkdtemp(join(tmpdir(), 'craftcv-integration-'))
const repository = join(temporary, 'sample-project'),
  data = join(temporary, 'data')
await mkdir(repository)
execFileSync('git', ['init', '-q', repository])
await writeFile(
  join(repository, 'App.tsx'),
  'import React from "react"\nexport function App() { return <main aria-label="Resume">Hello</main> }\n',
)
await writeFile(
  join(repository, 'app.test.ts'),
  'import {it,expect} from "vitest"\nit("renders",()=>expect(true).toBe(true))\n',
)
const cv = join(temporary, 'resume.md')
await writeFile(cv, 'Alex Developer\nSoftware developer\nExperience building user interfaces.')
const environment = { ...process.env, CRAFTCV_TEST_DATA: data }
delete environment.ELECTRON_RUN_AS_NODE
const start = performance.now()
const executable = process.env.CRAFTCV_EXECUTABLE
const app = await electron.launch({
  ...(executable ? { executablePath: executable, args: [] } : { args: [resolve('.')] }),
  env: environment,
})
try {
  const page = await app.firstWindow()
  page.on('pageerror', (e) => console.error('Renderer error:', e.message))
  // a new install opens on the welcome, then the wizard with the setup checklist above it
  await page.getByRole('button', { name: 'Get started' }).click()
  await expect(page.getByRole('heading', { name: 'New application' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Set up CraftCV' })).toBeVisible()
  const startupMs = Math.round(performance.now() - start)
  await page.waitForTimeout(1000)
  const idleMetrics = await app.evaluate(({ app }) => app.getAppMetrics())
  await mkdir('artifacts', { recursive: true })
  await page.screenshot({ path: 'artifacts/workspace.png', fullPage: true })
  await page.setViewportSize({ width: 860, height: 680 })
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth))
    throw new Error('Horizontal overflow at minimum width')
  await page.setViewportSize({ width: 1245, height: 820 })
  // the new-application wizard: job, requirements, CV, projects
  await page.getByRole('tab', { name: /Paste the text/ }).click()
  await page
    .getByLabel('Target job description')
    .fill(
      'Frontend Developer\nAcme is hiring.\nRequirements:\n- React and testing\n- Accessibility experience',
    )
  await page.getByRole('button', { name: 'Analyse the job' }).click()
  await expect(page.getByRole('region', { name: 'Check the job' })).toBeVisible()
  await expect(page.getByLabel('Role')).toHaveValue('Frontend Developer')
  await expect(page.getByLabel('Company')).toHaveValue('Acme')
  await page.getByRole('button', { name: 'Continue' }).click()
  await app.evaluate(({ dialog }, cv) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [cv] })
  }, cv)
  await page.getByRole('button', { name: /Import (your|another) CV/ }).click()
  await expect(page.getByText('Imported resume.md', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await app.evaluate(({ dialog }, repository) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [repository] })
  }, repository)
  await page.getByRole('button', { name: 'Import project folder' }).click()
  await expect(page.getByText('sample-project', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Analyze selected projects' }).click()
  await expect(page.getByText('Supporting evidence', { exact: true }).first()).toBeVisible({
    timeout: 20000,
  })
  await page.getByText('Supporting evidence', { exact: true }).first().click()
  await expect(page.locator('.evidence pre').first()).toBeVisible()
  const suggestion = page
    .locator('article.suggestion')
    .filter({ has: page.locator('.skill-tag', { hasText: /^React$/ }) })
  await suggestion.getByRole('textbox').fill('Reduced React latency by 50%')
  await suggestion.getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Resolve unsupported claims')
  await suggestion.getByRole('textbox').fill('Worked with React in project source code.')
  await suggestion.getByRole('button', { name: 'Approve', exact: true }).click()
  await expect(suggestion.locator('.status-label')).toHaveText('approved')
  await page.getByRole('button', { name: 'Copy approved (1)' }).click()
  const copied = await app.evaluate(({ clipboard }) => clipboard.readText())
  if (!copied.includes('React')) throw new Error('Copy did not contain the approved bullet')
  const pdf = join(temporary, 'resume.pdf'),
    docx = join(temporary, 'resume.docx')
  for (const [format, path] of [
    ['PDF', pdf],
    ['DOCX', docx],
  ]) {
    await app.evaluate(({ dialog }, path) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath: path })
    }, path)
    await page.getByRole('button', { name: format, exact: true }).click()
    await expect(page.getByText(`Resume exported to ${path}`, { exact: true })).toBeVisible()
  }
  if (!(await readFile(pdf)).subarray(0, 4).equals(Buffer.from('%PDF')))
    throw new Error('Invalid PDF')
  if (!(await readFile(docx)).subarray(0, 2).equals(Buffer.from('PK')))
    throw new Error('Invalid DOCX')
  // Validate the exported PDF can be parsed back through the actual import path.
  // the CV picker is on the CV step; the review keeps its session for later
  await page
    .getByRole('navigation', { name: 'Application steps' })
    .getByRole('button', { name: /Your CV/ })
    .click()
  await app.evaluate(({ dialog }, pdf) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [pdf] })
  }, pdf)
  await page.getByRole('button', { name: /Import (your|another) CV/ }).click()
  await expect(page.getByText('Imported resume.pdf', { exact: true })).toBeVisible({
    timeout: 20000,
  })
  const dashboard = await page.evaluate(() => window.craftcv.dashboard())
  if (!dashboard.ok) throw new Error('Dashboard failed')
  const importedPDF = dashboard.value.resumes.find((r) => r.name === 'resume.pdf')
  const pdfText = await page.evaluate((id) => window.craftcv.getResume(id), importedPDF?.id)
  if (!pdfText.ok || !pdfText.value.text.includes('React'))
    throw new Error('PDF roundtrip lost approved text')
  await app.evaluate(({ dialog }, docx) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [docx] })
  }, docx)
  await page.getByRole('button', { name: /Import (your|another) CV/ }).click()
  await expect(page.getByText('Imported resume.docx', { exact: true })).toBeVisible({
    timeout: 20000,
  })
  await page.screenshot({ path: 'artifacts/review.png', fullPage: true })
  // the tracker: the application was created with the job, and reopens at its review
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Applications' })
    .click()
  // the list is the default view: one row per application, its status in a select
  const row = page.getByRole('row').filter({ hasText: 'Frontend Developer' })
  await expect(row).toContainText('Acme')
  await row.getByRole('button', { name: 'Continue' }).click()
  // it reopens where it was left, the CV step, with its analysis a step away
  await expect(page.getByRole('heading', { name: 'Choose your master CV' })).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Application steps' })
    .getByRole('button', { name: /Review/ })
    .click()
  await expect(page.getByRole('button', { name: 'Copy approved (1)' })).toBeVisible()
  await page.getByRole('button', { name: 'Mark as applied' }).click()
  const tracked = await page.evaluate(() => window.craftcv.dashboard())
  const application = tracked.value.applications[0]
  if (application?.status !== 'applied' || !application.sessionId || !application.appliedAt)
    throw new Error('The application was not tracked through to Applied')
  await page.getByRole('button', { name: 'Open in editor', exact: true }).click()
  const documentEditor = page.getByRole('textbox', { name: 'Resume document', exact: true })
  await expect(documentEditor).toContainText('Worked with React')
  await expect(documentEditor).toContainText('Alex Developer')
  await expect(documentEditor).not.toContainText('Worked with Testing')
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'New application', exact: true })
    .click()
  const security = await app.evaluate(({ BrowserWindow }) => {
    const windows = BrowserWindow.getAllWindows()
    return { count: windows.length, preferences: windows[0].webContents.getLastWebPreferences() }
  })
  if (
    security.count !== 1 ||
    !security.preferences.sandbox ||
    !security.preferences.contextIsolation ||
    security.preferences.nodeIntegration
  )
    throw new Error('Window security regression')
  if ((await page.evaluate(() => typeof window.require)) !== 'undefined')
    throw new Error('Renderer exposes Node')
  const invalid = await page.evaluate(() =>
    window.craftcv.analyze({ projectIds: ['/etc'], job: 'x'.repeat(50), resumeId: null }),
  )
  if (invalid.ok) throw new Error('Unvalidated IPC')
  const saved = await page.evaluate(() => window.craftcv.dashboard())
  const cancelled = await page.evaluate(async (projectId) => {
    const pending = window.craftcv.analyze({
      projectIds: [projectId],
      job: 'React developer with testing experience required.',
      resumeId: null,
    })
    await window.craftcv.cancel()
    return pending
  }, saved.value.projects[0].id)
  if (cancelled.ok) throw new Error('Cancellation did not stop analysis')
  const noConsent = await page.evaluate(
    (sessionId) =>
      window.craftcv.generate({
        sessionId,
        provider: 'openai',
        model: 'gpt-4o-mini',
        consent: false,
        tokenBudget: null,
      }),
    saved.value.sessions[0].id,
  )
  if (noConsent.ok) throw new Error('Cloud consent was not enforced')
  const metrics = await app.evaluate(({ app }) =>
    app.getAppMetrics().map((p) => ({ type: p.type, memory: p.memory })),
  )
  const report = {
    startupToInteractiveMs: startupMs,
    idleWorkingSetMB: Math.round(
      idleMetrics.reduce((n, p) => n + p.memory.workingSetSize, 0) / 1024,
    ),
    totalWorkingSetMB: Math.round(metrics.reduce((n, p) => n + p.memory.workingSetSize, 0) / 1024),
    processes: metrics,
    packaged: !!executable,
    platform: process.platform,
    arch: process.arch,
  }
  await writeFile('artifacts/runtime-metrics.json', JSON.stringify(report, null, 2) + '\n')
  console.log(
    'Electron integration passed: analysis, evidence, approval, clipboard, PDF/DOCX roundtrip, history, SQLite, sandbox, IPC validation.',
  )
  console.log(JSON.stringify(report, null, 2))
} finally {
  await app.close()
  await rm(temporary, { recursive: true, force: true })
}
