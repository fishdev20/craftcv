import type Database from 'better-sqlite3'
import type { Application, ApplicationSummary } from '../../shared/contracts'

const APPLICATION_LIMIT = 200

const summary = (application: Application): ApplicationSummary => ({
  id: application.id,
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
  step: application.step,
  status: application.status,
  appliedAt: application.appliedAt,
  resumeId: application.resumeId,
  sessionId: application.sessionId,
  role: application.job.role,
  company: application.job.company,
  location: application.job.location,
  hasLink: application.job.url !== null,
})

/** Applications: each job applied for, from its first draft to its outcome. */
export class ApplicationStore {
  constructor(private db: Database.Database) {}

  list(): ApplicationSummary[] {
    return (
      this.db
        .prepare(
          `SELECT data FROM applications ORDER BY updated_at DESC LIMIT ${APPLICATION_LIMIT}`,
        )
        .all() as { data: string }[]
    ).map((row) => summary(JSON.parse(row.data) as Application))
  }

  get(id: string): Application {
    const row = this.db.prepare('SELECT data FROM applications WHERE id=?').get(id) as
      { data: string } | undefined
    if (!row) throw new Error('Application not found. It may have been removed.')
    return JSON.parse(row.data) as Application
  }

  /** Inserts or replaces the application. */
  save(application: Application) {
    const exists = this.db.prepare('SELECT id FROM applications WHERE id=?').get(application.id)
    if (!exists) {
      const { count } = this.db.prepare('SELECT count(*) AS count FROM applications').get() as {
        count: number
      }
      if (count >= APPLICATION_LIMIT)
        throw new Error(
          `CraftCV keeps up to ${APPLICATION_LIMIT} applications. Remove a closed one to add another.`,
        )
    }
    this.db
      .prepare('INSERT OR REPLACE INTO applications(id,data,updated_at) VALUES(?,?,?)')
      .run(application.id, JSON.stringify(application), application.updatedAt)
  }

  remove(id: string) {
    this.db.prepare('DELETE FROM applications WHERE id=?').run(id)
  }
}
