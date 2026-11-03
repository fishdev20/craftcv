import type Database from 'better-sqlite3'
import { randomUUID } from 'node:crypto'
import type { Project, ProjectAnalysis, Repository } from '../../shared/contracts'

const PROJECT_LIMIT = 10
const REPOSITORY_LIMIT = 25

type AddedProject = {
  project: Project
  repositories: Repository[]
  added: number
  skipped: number
}

/** Projects, and the repositories (services) that belong to them. */
export class ProjectStore {
  constructor(private db: Database.Database) {}

  repositories(): Repository[] {
    return this.db
      .prepare('SELECT id,name,path,project_id AS projectId FROM repositories ORDER BY name')
      .all() as Repository[]
  }

  list(): Project[] {
    const rows = this.db
      .prepare('SELECT id,name,root_path AS rootPath,analysis FROM projects ORDER BY name')
      .all() as { id: string; name: string; rootPath: string; analysis: string | null }[]
    const repositories = this.repositories()
    return rows.map(({ analysis, ...project }) => ({
      ...project,
      repositories: repositories.filter((repository) => repository.projectId === project.id),
      analysis: analysis ? (JSON.parse(analysis) as ProjectAnalysis) : null,
    }))
  }

  find(id: string): Project | undefined {
    return this.list().find((project) => project.id === id)
  }

  /**
   * Adds the project at rootPath (or reuses it) with the given repositories. Repositories
   * already known move into it; new ones stop at REPOSITORY_LIMIT and are counted as skipped.
   * Projects left without repositories by the move are removed.
   */
  add(rootPath: string, name: string, candidates: { path: string; name: string }[]): AddedProject {
    return this.db.transaction(() => {
      let project = this.list().find((item) => item.rootPath === rootPath)
      if (!project) {
        const candidatePaths = new Set(candidates.map((candidate) => candidate.path))
        const hasKnownServices = this.repositories().some((repository) =>
          candidatePaths.has(repository.path),
        )
        if (this.list().length >= PROJECT_LIMIT && !hasKnownServices)
          throw new Error(`Remove a project before adding another (limit: ${PROJECT_LIMIT}).`)
        const id = randomUUID()
        this.db
          .prepare('INSERT INTO projects(id,name,root_path) VALUES(?,?,?)')
          .run(id, name, rootPath)
        project = this.find(id)!
      }
      const known = new Map(this.repositories().map((repo) => [repo.path, repo]))
      const repositories: Repository[] = []
      let added = 0,
        skipped = 0
      for (const candidate of candidates) {
        const found = known.get(candidate.path)
        if (found) {
          this.db
            .prepare('UPDATE repositories SET project_id=? WHERE id=?')
            .run(project.id, found.id)
          repositories.push({ ...found, projectId: project.id })
          continue
        }
        if (known.size >= REPOSITORY_LIMIT) {
          skipped++
          continue
        }
        const repository = this.addRepository(candidate.path, candidate.name, project.id)
        known.set(repository.path, repository)
        repositories.push(repository)
        added++
      }
      this.db
        .prepare(
          'DELETE FROM projects WHERE id<>? AND NOT EXISTS (SELECT 1 FROM repositories WHERE repositories.project_id=projects.id)',
        )
        .run(project.id)
      return { project: this.find(project.id)!, repositories, added, skipped }
    })()
  }

  private addRepository(path: string, name: string, projectId: string): Repository {
    this.db
      .prepare('INSERT OR IGNORE INTO repositories(id,name,path,project_id) VALUES(?,?,?,?)')
      .run(randomUUID(), name, path, projectId)
    this.db.prepare('UPDATE repositories SET project_id=? WHERE path=?').run(projectId, path)
    return this.db
      .prepare('SELECT id,name,path,project_id AS projectId FROM repositories WHERE path=?')
      .get(path) as Repository
  }

  removeRepository(id: string) {
    this.db.prepare('DELETE FROM repositories WHERE id=?').run(id)
  }

  remove(id: string) {
    this.db.transaction(() => {
      this.db.prepare('DELETE FROM repositories WHERE project_id=?').run(id)
      this.db.prepare('DELETE FROM projects WHERE id=?').run(id)
    })()
  }

  saveAnalysis(id: string, analysis: ProjectAnalysis): Project {
    const result = this.db
      .prepare('UPDATE projects SET analysis=? WHERE id=?')
      .run(JSON.stringify(analysis), id)
    if (!result.changes) throw new Error('Project not found.')
    return this.find(id)!
  }
}
