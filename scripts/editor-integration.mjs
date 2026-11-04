import { _electron as electron, expect } from '@playwright/test'
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import JSZip from 'jszip'
const temporary = await mkdtemp(join(tmpdir(), 'craftcv-editor-'))
const data = join(temporary, 'data')
await mkdir(data)
// A real version-one database verifies migration without losing existing imported CV text.
const database = new DatabaseSync(join(data, 'craftcv.sqlite'))
database.exec(`CREATE TABLE resumes(id TEXT PRIMARY KEY,name TEXT NOT NULL,text TEXT NOT NULL);
CREATE TABLE repositories(id TEXT PRIMARY KEY,name TEXT NOT NULL,path TEXT NOT NULL UNIQUE);
CREATE TABLE jobs(id TEXT PRIMARY KEY,description TEXT NOT NULL,requirements TEXT NOT NULL);
CREATE TABLE tailoring_sessions(id TEXT PRIMARY KEY,job_id TEXT NOT NULL REFERENCES jobs(id),created_at TEXT NOT NULL,resume_id TEXT REFERENCES resumes(id) ON DELETE SET NULL,data TEXT NOT NULL);
CREATE TABLE bullet_suggestions(id TEXT PRIMARY KEY,session_id TEXT NOT NULL REFERENCES tailoring_sessions(id) ON DELETE CASCADE,data TEXT NOT NULL);
PRAGMA user_version=1;`)
const legacyId = 'a818f5c3-3a15-4619-aa66-a1a960c45651'
database
  .prepare('INSERT INTO resumes VALUES(?,?,?)')
  .run(legacyId, 'Existing CV', 'Legacy imported experience')
database.close()
const env = { ...process.env, CRAFTCV_TEST_DATA: data }
delete env.ELECTRON_RUN_AS_NODE
const executable = process.env.CRAFTCV_EXECUTABLE
const launch = () =>
  electron.launch({
    ...(executable ? { executablePath: executable, args: [] } : { args: [resolve('.')] }),
    env,
  })
let app = await launch()
try {
  let page = await app.firstWindow()
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Documents', exact: true })
    .click()
  await page.getByRole('link', { name: /Existing CV/ }).click()
  const editor = page.getByRole('textbox', { name: 'Resume document', exact: true })
  await expect(editor).toContainText('Legacy imported experience')
  await page.getByRole('link', { name: 'Back to documents' }).click()
  await page.getByRole('button', { name: 'Use Standard ATS', exact: true }).click()
  await expect(editor).toContainText('Professional summary')
  await expect(page.getByRole('textbox', { name: 'Document title', exact: true })).toHaveValue(
    'Standard ATS resume',
  )
  await page.getByRole('link', { name: 'Back to documents' }).click()
  await page.getByRole('button', { name: "Use Jake's Resume", exact: true }).click()
  await expect(editor).toContainText('EDUCATION')
  await expect(page.getByRole('textbox', { name: 'Document title', exact: true })).toHaveValue(
    "Jake's Resume CV",
  )
  await page.getByRole('link', { name: 'Back to documents' }).click()
  await page.getByRole('button', { name: 'Blank document', exact: true }).click()
  await expect(editor).toBeVisible()
  await page.getByRole('textbox', { name: 'Document title', exact: true }).fill('Alex Developer CV')
  await editor.fill('Alex Developer')
  await page.getByRole('button', { name: /Paragraph style/ }).click()
  await page.getByRole('option', { name: 'Heading 1', exact: true }).click()
  await expect(editor.locator('h1')).toHaveText('Alex Developer')
  await editor.press('End')
  await editor.press('Enter')
  await page.getByRole('button', { name: /Paragraph style/ }).click()
  await page.getByRole('option', { name: 'Normal text', exact: true }).click()
  await page.getByRole('button', { name: 'Bold', exact: true }).click()
  // the toolbar hands focus back to the editor; typing before then drops the first key
  await expect(editor).toBeFocused()
  await page.keyboard.type('Software engineer')
  await expect(editor.locator('strong')).toContainText('Software engineer')
  await page.getByRole('button', { name: 'Bold', exact: true }).click()
  await page.getByRole('button', { name: 'Undo', exact: true }).click()
  await expect(editor).not.toContainText('Software engineer')
  await page.getByRole('button', { name: 'Redo', exact: true }).click()
  await expect(editor).toContainText('Software engineer')
  await editor.press('End')
  await editor.press('Enter')
  await page.getByRole('button', { name: 'Bulleted list', exact: true }).click()
  await page.keyboard.type('Built accessible interfaces')
  await expect(editor.locator('ul li')).toContainText('Built accessible interfaces')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await page.getByRole('button', { name: 'Insert', exact: true }).click()
  await page.getByRole('menuitem', { name: /Table/ }).click()
  await expect(editor.locator('table')).toBeVisible()
  await editor.locator('th').first().click()
  await page.keyboard.type('Skills')
  await page.getByRole('button', { name: 'Add column', exact: true }).click()
  await expect(editor.locator('tr').first().locator('th,td')).toHaveCount(3)
  await page.getByRole('button', { name: 'Delete column', exact: true }).click()
  await expect(editor.locator('tr').first().locator('th,td')).toHaveCount(2)
  await editor.locator('th').first().click()
  await page.keyboard.type('Skills')
  await expect(page.getByText('All changes saved locally', { exact: true })).toBeVisible()
  const id = page.url().split('/').at(-1)
  const saved = await page.evaluate((id) => window.craftcv.getResume(id), id)
  if (!saved.ok || !JSON.stringify(saved.value.document).includes('bold'))
    throw new Error('Rich formatting was not saved')
  // Optimistic revision control rejects a stale writer, rather than losing newer edits.
  const stale = await page.evaluate(
    (resume) => window.craftcv.saveResume({ ...resume, revision: 0 }),
    saved.value,
  )
  if (stale.ok) throw new Error('Stale document revision accepted')
  await mkdir('artifacts', { recursive: true })
  await page.screenshot({ path: 'artifacts/document-editor.png', fullPage: true })
  const docx = join(temporary, 'edited.docx'),
    pdf = join(temporary, 'edited.pdf')
  for (const [format, path] of [
    ['DOCX', docx],
    ['PDF', pdf],
  ]) {
    await app.evaluate(({ dialog }, filePath) => {
      dialog.showSaveDialog = async () => ({ canceled: false, filePath })
    }, path)
    await page.getByRole('button', { name: format, exact: true }).click()
    await expect(page.getByText(`Document exported to ${path}`, { exact: true })).toBeVisible()
  }
  const zip = await JSZip.loadAsync(await readFile(docx)),
    xml = await zip.file('word/document.xml').async('string')
  for (const expected of ['Heading1', '<w:b/>', '<w:tbl>', '<w:numPr>', 'Software engineer'])
    if (!xml.includes(expected)) throw new Error(`DOCX missing ${expected}`)
  await app.evaluate(({ dialog }, path) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] })
  }, pdf)
  const imported = await page.evaluate(() => window.craftcv.importResume())
  if (
    !imported.ok ||
    !imported.value.text.includes('Software engineer') ||
    !imported.value.text.includes('Skills')
  )
    throw new Error('Edited PDF roundtrip failed')
  // Navigation before the debounce fires must still save the latest edit.
  await page
    .getByRole('textbox', { name: 'Document title', exact: true })
    .fill('Autosaved after navigation')
  await page.getByRole('link', { name: 'Back to documents' }).click()
  await page.waitForTimeout(900)
  await app.close()
  app = await launch()
  page = await app.firstWindow()
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Documents', exact: true })
    .click()
  await page.getByRole('link', { name: /Autosaved after navigation/ }).click()
  await expect(page.getByRole('textbox', { name: 'Resume document', exact: true })).toContainText(
    'Software engineer',
  )
  await page.setViewportSize({ width: 860, height: 680 })
  if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth))
    throw new Error('Editor causes window overflow at minimum width')
  if (errors.length) throw new Error(errors.join('\n'))
  console.log(
    'Editor integration passed: v1 migration, rich editing, undo/redo, tables, revision conflict, autosave across navigation/restart, PDF/DOCX exports, narrow viewport.',
  )
} finally {
  await app.close()
  await rm(temporary, { recursive: true, force: true })
}
