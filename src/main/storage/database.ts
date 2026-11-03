import Database from 'better-sqlite3'
import { migrate } from './migrations'

/** Opens the SQLite file with WAL, foreign keys and a busy timeout, migrated to the current schema. */
export function openDatabase(path: string): Database.Database {
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 3000')
  migrate(db)
  return db
}
