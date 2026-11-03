import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import { dirname, sep } from 'node:path'

const SCHEMA_VERSION = 5

/**
 * Brings a database up to SCHEMA_VERSION, one transaction per step, and refuses data written
 * by a newer CraftCV. Steps only ever append: never edit one that has shipped.
 */
export function migrate(db: Database.Database) {
  const version = db.pragma('user_version', { simple: true }) as number
  if (version > SCHEMA_VERSION) throw new Error('This data was created by a newer CraftCV version.')
  if (version < 1)
    db.transaction(() => {
      db.exec(`
  CREATE TABLE resumes(id TEXT PRIMARY KEY,name TEXT NOT NULL,text TEXT NOT NULL);
  CREATE TABLE repositories(id TEXT PRIMARY KEY,name TEXT NOT NULL,path TEXT NOT NULL UNIQUE);
  CREATE TABLE jobs(id TEXT PRIMARY KEY,description TEXT NOT NULL,requirements TEXT NOT NULL);
  CREATE TABLE tailoring_sessions(id TEXT PRIMARY KEY,job_id TEXT NOT NULL REFERENCES jobs(id),created_at TEXT NOT NULL,resume_id TEXT REFERENCES resumes(id) ON DELETE SET NULL,data TEXT NOT NULL);
  CREATE TABLE bullet_suggestions(id TEXT PRIMARY KEY,session_id TEXT NOT NULL REFERENCES tailoring_sessions(id) ON DELETE CASCADE,data TEXT NOT NULL);
  CREATE INDEX suggestions_session ON bullet_suggestions(session_id);
  CREATE INDEX sessions_created ON tailoring_sessions(created_at DESC);
  PRAGMA user_version = 1;
 `)
    })()
  if (version < 2)
    db.transaction(() => {
      db.exec(`ALTER TABLE resumes ADD COLUMN document TEXT;
      ALTER TABLE resumes ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE resumes ADD COLUMN updated_at TEXT;
      PRAGMA user_version = 2;`)
    })()
  if (version < 3)
    db.transaction(() => {
      db.exec(`CREATE TABLE projects(
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        root_path TEXT NOT NULL UNIQUE,
        analysis TEXT
      );
      ALTER TABLE repositories ADD COLUMN project_id TEXT REFERENCES projects(id);
      CREATE INDEX repositories_project ON repositories(project_id);
      PRAGMA user_version = 3;`)
      const repositories = db.prepare('SELECT id,name,path FROM repositories').all() as {
        id: string
        name: string
        path: string
      }[]
      const insert = db.prepare('INSERT INTO projects(id,name,root_path) VALUES(?,?,?)')
      const assign = db.prepare('UPDATE repositories SET project_id=? WHERE id=?')
      for (const repository of repositories) {
        const projectId = randomUUID()
        insert.run(projectId, repository.name, repository.path)
        assign.run(projectId, repository.id)
      }
    })()
  if (version < 4)
    db.transaction(() => {
      const rows = db
        .prepare(
          `SELECT r.id AS repositoryId,r.name AS repositoryName,r.path,
                  p.id AS projectId,p.analysis
           FROM repositories r JOIN projects p ON p.id=r.project_id`,
        )
        .all() as {
        repositoryId: string
        repositoryName: string
        path: string
        projectId: string
        analysis: string | null
      }[]
      const groups = new Map<string, typeof rows>()
      for (const row of rows) {
        const separator = row.repositoryName.indexOf(' / ')
        if (separator < 1) continue
        const name = row.repositoryName.slice(0, separator)
        groups.set(name, [...(groups.get(name) ?? []), row])
      }
      for (const [name, repositories] of groups) {
        const projectIds = new Set(repositories.map((repository) => repository.projectId))
        if (repositories.length < 2 || projectIds.size < 2) continue
        if (repositories.some((repository) => repository.analysis)) continue
        let rootPath = dirname(repositories[0].path)
        while (
          !repositories.every(
            (repository) =>
              repository.path === rootPath || repository.path.startsWith(rootPath + sep),
          )
        ) {
          const parent = dirname(rootPath)
          if (parent === rootPath) break
          rootPath = parent
        }
        const existing = db.prepare('SELECT id FROM projects WHERE root_path=?').get(rootPath) as
          { id: string } | undefined
        const projectId = existing?.id ?? randomUUID()
        if (!existing)
          db.prepare('INSERT INTO projects(id,name,root_path) VALUES(?,?,?)').run(
            projectId,
            name,
            rootPath,
          )
        const assign = db.prepare('UPDATE repositories SET project_id=? WHERE id=?')
        for (const repository of repositories) assign.run(projectId, repository.repositoryId)
      }
      db.exec(`DELETE FROM projects
        WHERE NOT EXISTS (
          SELECT 1 FROM repositories WHERE repositories.project_id=projects.id
        );
        PRAGMA user_version = 4;`)
    })()
  if (version < 5)
    // one row per application: the wizard's progress and the tracker's card, as JSON
    db.exec(`CREATE TABLE applications(
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    PRAGMA user_version = 5;`)
}
