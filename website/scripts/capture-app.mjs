// Captures the real desktop app for the website: screenshots of its main screens and a screen
// recording of one tailoring run (as numbered JPEG frames; Playwright's own Electron recorder
// hangs without its video tool), all with made-up demo content in a throwaway data folder, so
// nothing personal can reach the site.
//
// Run from the repository root after `npm run build` (it drives the built app in out/):
//   node website/scripts/capture-app.mjs
// It writes raw captures to website/.capture/ (git-ignored); website/scripts/encode-app.sh then
// turns the ones the home page shows into the JPEG screenshots in website/public/app/.

import { _electron as electron, expect } from '@playwright/test'
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import { mkdtemp, mkdir, writeFile, rm, readdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve('.')
const capture = join(root, 'website/.capture')
await mkdir(capture, { recursive: true })
const temporary = await mkdtemp(join(tmpdir(), 'craftcv-capture-'))
const data = join(temporary, 'data')

// ------------------------------------------------------------------ demo content
// a real Word file, so the editor shows headings and bullets rather than Markdown marks
const cv = join(temporary, 'Alex Kim CV.docx')
const heading = (text, level) => new Paragraph({ text, heading: level })
const line = (text) => new Paragraph({ children: [new TextRun(text)] })
const bullet = (text) => new Paragraph({ text, bullet: { level: 0 } })
await writeFile(
  cv,
  await Packer.toBuffer(
    new Document({
      sections: [
        {
          children: [
            heading('Alex Kim', HeadingLevel.TITLE),
            line('Frontend engineer · Berlin · alex.kim@mail.example'),
            heading('Summary', HeadingLevel.HEADING_1),
            line(
              'Frontend engineer with six years of building product interfaces in React and TypeScript, with a focus on accessible, keyboard-first tools.',
            ),
            heading('Experience', HeadingLevel.HEADING_1),
            heading('Product engineer, Northwind · 2022 to now', HeadingLevel.HEADING_2),
            bullet('Rebuilt the billing dashboard in React and TypeScript.'),
            bullet('Built data tables for the admin dashboard.'),
            bullet('Wrote end-to-end tests for checkout and invoices.'),
            heading('Frontend developer, Arbor · 2019 to 2022', HeadingLevel.HEADING_2),
            bullet('Shipped the onboarding flow and its form validation.'),
            bullet("Maintained the design system's component library."),
            heading('Skills', HeadingLevel.HEADING_1),
            line('React, TypeScript, CSS, Testing, Node.js'),
          ],
        },
      ],
    }),
  ),
)

const repository = join(temporary, 'northwind-dashboard')
const file = async (path, text) => {
  await mkdir(join(repository, path, '..'), { recursive: true })
  await writeFile(join(repository, path), text)
}
execFileSync('git', ['init', '-q', repository])
await file(
  'package.json',
  JSON.stringify(
    {
      name: 'northwind-dashboard',
      dependencies: { react: '19.0.0', 'react-dom': '19.0.0', '@tanstack/react-virtual': '3.0.0' },
      devDependencies: { typescript: '5.6.0', vitest: '2.1.0', '@playwright/test': '1.48.0' },
    },
    null,
    2,
  ),
)
await file(
  'src/Table.tsx',
  `import { useVirtualizer } from '@tanstack/react-virtual'

export function Table({ rows }: Props) {
  // keyboard-accessible data table with ARIA grid roles
  return <table role="grid" aria-rowcount={rows.length} onKeyDown={move}>
    {rows.map((row) => <Row key={row.id} row={row} />)}
  </table>
}
`,
)
await file(
  'src/Table.test.tsx',
  `import { render, screen } from '@testing-library/react'
import { it, expect } from 'vitest'
it('moves focus with the arrow keys', () => {
  render(<Table rows={rows} />)
  expect(screen.getByRole('grid')).toBeTruthy()
})
`,
)
await file(
  'src/accessibility.ts',
  `// focus management and screen reader announcements for the dashboard
export function announce(message: string) {
  const region = document.querySelector('[aria-live="polite"]')
  if (region) region.textContent = message
}
`,
)
await file(
  'e2e/checkout.spec.ts',
  `import { test, expect } from '@playwright/test'
test('pays an invoice', async ({ page }) => {
  await page.goto('/invoices')
  await expect(page.getByRole('grid')).toBeVisible()
})
`,
)
execFileSync('git', ['-C', repository, 'add', '-A'])
execFileSync('git', [
  '-C',
  repository,
  '-c',
  'user.name=Alex Kim',
  '-c',
  'user.email=alex.kim@mail.example',
  'commit',
  '-q',
  '-m',
  'Add the dashboard table',
])

const job = `Senior Frontend Engineer
Halden is hiring a Senior Frontend Engineer, remote in Europe.

Requirements:
- Production experience with React and TypeScript
- Accessibility: you build keyboard-first, screen-reader-friendly interfaces
- Testing with Vitest or Playwright
- Performance work on large data views

Nice to have:
- GraphQL
- WebSockets`

// ------------------------------------------------------------------ the run
const environment = { ...process.env, CRAFTCV_TEST_DATA: data }
delete environment.ELECTRON_RUN_AS_NODE
const app = await electron.launch({ args: [root], env: environment })
const page = await app.firstWindow()
const frames = join(capture, 'frames')
await rm(frames, { recursive: true, force: true })
await mkdir(frames, { recursive: true })
// the recording: a loop of JPEG screenshots, stitched into a video by encode-app.sh
let recording = null
// the frame each step of the run starts on, so the site can follow the video with its steps
const steps = {}
let count = 0
const step = (name) => (steps[name] = count)
const record = () => {
  let stop = false
  const started = Date.now()
  const done = (async () => {
    while (!stop) {
      const name = String(count++).padStart(5, '0')
      await page
        .screenshot({ path: join(frames, `${name}.jpg`), type: 'jpeg', quality: 82 })
        .catch(() => {})
    }
    return { count, seconds: (Date.now() - started) / 1000, steps }
  })()
  recording = async () => {
    stop = true
    const result = await done
    await writeFile(join(capture, 'frames.json'), JSON.stringify(result) + '\n')
    return result
  }
}
try {
  page.on('pageerror', (error) => console.error('Renderer error:', error.message))
  // fail a missing step in 20 seconds instead of waiting forever
  page.setDefaultTimeout(20000)
  await page.setViewportSize({ width: 1440, height: 900 })
  const shot = (name) => page.screenshot({ path: join(capture, `${name}.png`) })
  const pick = (paths) =>
    app.evaluate(({ dialog }, paths) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: paths })
    }, paths)

  // first run: the CV and the project come in here
  await page.getByRole('button', { name: /Get started/ }).click()
  await pick([cv])
  await page.getByRole('button', { name: 'Import CV' }).click()
  await expect(page.getByText('Alex Kim CV.docx').first()).toBeVisible()
  await page.waitForTimeout(500)
  await shot('onboarding-cv')
  await page.getByRole('button', { name: /^Continue/ }).click()
  await pick([repository])
  await page.getByRole('button', { name: 'Add project folder' }).click()
  await expect(page.getByText('northwind-dashboard').first()).toBeVisible()
  await page.getByRole('button', { name: /^Continue/ }).click()
  await page.getByRole('button', { name: /Open workspace/ }).click()
  await expect(page.getByRole('heading', { name: 'New application' })).toBeVisible()
  await page.waitForTimeout(600)

  // the tailoring run, recorded
  record()
  step('job')
  await page.getByRole('tab', { name: /Paste the text/ }).click()
  await page.getByLabel('Target job description').pressSequentially(job.slice(0, 60), { delay: 18 })
  await page.getByLabel('Target job description').fill(job)
  await page.waitForTimeout(500)
  await shot('job')
  step('check')
  await page.getByRole('button', { name: 'Check job details' }).click()
  await expect(page.getByRole('region', { name: 'Check the job' })).toBeVisible()
  await page.waitForTimeout(900)
  await shot('job-check')
  step('cv')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForTimeout(700)
  await shot('cv')
  step('projects')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('northwind-dashboard').first()).toBeVisible()
  const analyze = page.getByRole('button', { name: 'Analyze selected projects' })
  // the project added during the first run may need choosing for this application
  if (await analyze.isDisabled()) await page.getByText('northwind-dashboard').first().click()
  await page.waitForTimeout(500)
  step('analyse')
  await page.getByRole('button', { name: 'Analyze selected projects' }).click()
  await expect(page.getByText('Supporting evidence', { exact: true }).first()).toBeVisible({
    timeout: 30000,
  })
  await page.waitForTimeout(900)
  step('evidence')
  await page.getByText('Supporting evidence', { exact: true }).first().click()
  await expect(page.locator('.evidence pre').first()).toBeVisible()
  await page.waitForTimeout(900)
  await shot('evidence')
  step('approve')
  // approve the first two suggestions, so coverage shows real numbers
  for (const index of [0, 1]) {
    await page
      .locator('article.suggestion')
      .nth(index)
      .getByRole('button', { name: 'Approve', exact: true })
      .click()
    await page.waitForTimeout(600)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.locator('main').evaluate((main) => main.scrollTo?.(0, 0))
  await page.waitForTimeout(900)
  await shot('review')
  console.log('recording:', JSON.stringify(await recording()))
  recording = null

  // the tailored CV, opened in the editor
  await page.getByRole('button', { name: 'Mark as applied' }).click()
  await page.getByRole('button', { name: 'Open in editor', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Resume document', exact: true })).toBeVisible()
  await page.waitForTimeout(1200)
  await shot('editor-tailored')

  // the tracker
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Applications' })
    .click()
  await page.waitForTimeout(900)
  await shot('applications')

  // documents: the template gallery and the editor
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Documents', exact: true })
    .click()
  await page.waitForTimeout(900)
  await shot('documents')
  await page.getByRole('button', { name: "Use Jake's Resume", exact: true }).click()
  await page.waitForTimeout(1200)
  await shot('editor')
} catch (error) {
  await page.screenshot({ path: join(capture, 'debug-error.png') }).catch(() => {})
  throw error
} finally {
  if (recording) await recording()
  await app.close()
  await rm(temporary, { recursive: true, force: true })
}
console.log('captured:', (await readdir(capture)).join(', '))
