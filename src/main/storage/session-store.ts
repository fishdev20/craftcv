import type Database from 'better-sqlite3'
import type { Session, Suggestion } from '../../shared/contracts'

const SESSION_LIMIT = 100

type SessionSummary = { id: string; createdAt: string; title: string }

/** Tailoring sessions: the job, its evidence snapshot, and the suggested bullets. */
export class SessionStore {
  constructor(private db: Database.Database) {}

  list(): SessionSummary[] {
    return this.db
      .prepare(
        `SELECT s.id,s.created_at AS createdAt,substr(j.description,1,90) AS title FROM tailoring_sessions s JOIN jobs j ON j.id=s.job_id ORDER BY s.created_at DESC LIMIT ${SESSION_LIMIT}`,
      )
      .all() as SessionSummary[]
  }

  get(id: string): Session {
    const row = this.db
      .prepare('SELECT data,resume_id FROM tailoring_sessions WHERE id=?')
      .get(id) as { data: string; resume_id: string | null } | undefined
    if (!row) throw new Error('Session not found.')
    const suggestions = (
      this.db.prepare('SELECT data FROM bullet_suggestions WHERE session_id=?').all(id) as {
        data: string
      }[]
    ).map((r) => JSON.parse(r.data) as Suggestion)
    return { ...(JSON.parse(row.data) as Session), resumeId: row.resume_id, suggestions }
  }

  /** Inserts or replaces the whole session, its suggestions included. */
  save(session: Session) {
    this.db.transaction(() => {
      if (
        !this.db.prepare('SELECT id FROM tailoring_sessions WHERE id=?').get(session.id) &&
        this.list().length >= SESSION_LIMIT
      )
        throw new Error(`Remove an old session before creating more (limit: ${SESSION_LIMIT}).`)
      this.db
        .prepare(
          'INSERT INTO jobs VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET description=excluded.description,requirements=excluded.requirements',
        )
        .run(session.id, session.job, JSON.stringify(session.requirements))
      const { suggestions, ...rest } = session
      this.db
        .prepare(
          'INSERT INTO tailoring_sessions VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
        )
        .run(session.id, session.id, session.createdAt, session.resumeId, JSON.stringify(rest))
      this.db.prepare('DELETE FROM bullet_suggestions WHERE session_id=?').run(session.id)
      const insert = this.db.prepare('INSERT INTO bullet_suggestions VALUES(?,?,?)')
      for (const suggestion of suggestions)
        insert.run(suggestion.id, session.id, JSON.stringify(suggestion))
    })()
  }

  remove(id: string) {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM tailoring_sessions WHERE id=?').run(id)
      this.db.prepare('DELETE FROM jobs WHERE id=?').run(id)
    })()
  }

  getSuggestion(id: string): Suggestion {
    const row = this.db.prepare('SELECT data FROM bullet_suggestions WHERE id=?').get(id) as
      { data: string } | undefined
    if (!row) throw new Error('Suggestion not found.')
    return JSON.parse(row.data) as Suggestion
  }

  saveSuggestion(suggestion: Suggestion) {
    this.db
      .prepare('UPDATE bullet_suggestions SET data=? WHERE id=?')
      .run(JSON.stringify(suggestion), suggestion.id)
  }
}
