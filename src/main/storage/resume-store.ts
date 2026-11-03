import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import type { Resume, SaveResumeRequest } from '../../shared/contracts'
import { documentText, parseDocument, textDocument, type DocumentNode } from '../../shared/document'

const RESUME_LIMIT = 25

type ResumeRow = {
  id: string
  name: string
  text: string
  document: string | null
  revision: number
  updated_at: string | null
}

/** CVs and edited documents. An imported CV has only text until it is first edited. */
export class ResumeStore {
  constructor(private db: Database.Database) {}

  list(): Pick<Resume, 'id' | 'name'>[] {
    return this.db.prepare('SELECT id,name FROM resumes ORDER BY name').all() as Pick<
      Resume,
      'id' | 'name'
    >[]
  }

  get(id: string): Resume | undefined {
    const row = this.db.prepare('SELECT * FROM resumes WHERE id=?').get(id) as ResumeRow | undefined
    if (!row) return undefined
    return {
      id: row.id,
      name: row.name,
      text: row.text,
      document: row.document ? parseDocument(JSON.parse(row.document)) : textDocument(row.text),
      revision: row.revision,
      updatedAt: row.updated_at,
    }
  }

  private assertRoom() {
    if (this.list().length >= RESUME_LIMIT)
      throw new Error(`Remove a CV before adding more (limit: ${RESUME_LIMIT}).`)
  }

  addText(name: string, text: string): Resume {
    this.assertRoom()
    const id = randomUUID()
    this.db.prepare('INSERT INTO resumes(id,name,text) VALUES(?,?,?)').run(id, name, text)
    return this.get(id)!
  }

  addDocument(name: string, input: DocumentNode): Resume {
    this.assertRoom()
    const document = parseDocument(input),
      id = randomUUID()
    this.db
      .prepare('INSERT INTO resumes(id,name,text,document,updated_at) VALUES(?,?,?,?,?)')
      .run(
        id,
        name.slice(0, 200),
        documentText(document),
        JSON.stringify(document),
        new Date().toISOString(),
      )
    return this.get(id)!
  }

  /** Saves only on top of the revision the editor loaded, so two saves never overwrite each other. */
  save(request: SaveResumeRequest): Resume {
    const document = parseDocument(request.document)
    const result = this.db
      .prepare(
        'UPDATE resumes SET name=?,text=?,document=?,revision=revision+1,updated_at=? WHERE id=? AND revision=?',
      )
      .run(
        request.name,
        documentText(document),
        JSON.stringify(document),
        new Date().toISOString(),
        request.id,
        request.revision,
      )
    if (result.changes !== 1)
      throw new Error(
        'This document changed or was removed. Your unsaved draft has been kept. Save a copy to preserve your changes without overwriting the saved version.',
      )
    return this.get(request.id)!
  }

  remove(id: string) {
    this.db.prepare('DELETE FROM resumes WHERE id=?').run(id)
  }
}
