import type Database from 'better-sqlite3'
import { ApplicationStore } from './application-store'
import { openDatabase } from './database'
import { ProjectStore } from './project-store'
import { ResumeStore } from './resume-store'
import { SessionStore } from './session-store'

/** The local SQLite database, one store per kind of record. */
export class Store {
  private db: Database.Database
  readonly projects: ProjectStore
  readonly resumes: ResumeStore
  readonly sessions: SessionStore
  readonly applications: ApplicationStore

  constructor(path: string) {
    this.db = openDatabase(path)
    this.projects = new ProjectStore(this.db)
    this.resumes = new ResumeStore(this.db)
    this.sessions = new SessionStore(this.db)
    this.applications = new ApplicationStore(this.db)
  }

  close() {
    this.db.close()
  }
}
