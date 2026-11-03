import { basename } from 'node:path'
import { dialog } from 'electron'
import type { AnalyzeProjectRequest, FolderImport, Project } from '../../shared/contracts'
import { removeCache } from '../scanning/scan-cache'
import type { ServiceDeps } from './deps'
import { providerKey } from './provider-access'

export function createProjectService(deps: ServiceDeps) {
  const { store, paths, operations, progress, window } = deps
  return {
    /**
     * Asks for a folder and adds it as one project: the Git repository it is, or the service
     * repositories found under it, within the discovery limits.
     */
    import: () =>
      operations.run(async (signal): Promise<FolderImport | null> => {
        const picked = await dialog.showOpenDialog(window(), {
          title: 'Choose a repository or a folder containing services',
          properties: ['openDirectory'],
        })
        if (picked.canceled || !picked.filePaths[0]) return null
        signal.throwIfAborted()
        const { discoverRepositories } = await import('../scanning/repository-discovery')
        const discovered = await discoverRepositories(picked.filePaths[0], signal, progress)
        signal.throwIfAborted()
        if (!discovered.repositories.length)
          throw new Error(
            discovered.limited || discovered.unreadable
              ? 'No Git repositories found within the discovery limits. Try selecting a more specific services folder.'
              : 'No Git repositories found in this folder. Choose a Git monorepo or a parent folder containing service repositories.',
          )
        return {
          ...discovered,
          ...store.projects.add(
            discovered.folder,
            basename(discovered.folder),
            discovered.repositories,
          ),
        }
      }),

    /** Removes a project and its repositories, and deletes their scan caches. */
    async remove(id: string) {
      operations.assertIdle('Wait for the current operation before removing a project.')
      const project = store.projects.find(id)
      if (!project) return
      for (const repository of project.repositories) await removeCache(paths.cache, repository.path)
      store.projects.remove(id)
    },

    async removeRepository(id: string) {
      operations.assertIdle('Wait for the current operation before removing a repository.')
      const repository = store.projects.repositories().find((r) => r.id === id)
      if (repository) await removeCache(paths.cache, repository.path)
      store.projects.removeRepository(id)
    },

    /** Reads a project's README and manifests, and asks the chosen provider what it is. */
    analyze: (request: AnalyzeProjectRequest) =>
      operations.run(async (signal): Promise<Project> => {
        const project = store.projects.find(request.projectId)
        if (!project) throw new Error('Project not found. Import it again.')
        const key = await providerKey(deps, request.provider, signal)
        progress({ phase: `Reading ${project.name}`, files: 0, total: project.repositories.length })
        const { collectProjectContext } = await import('../scanning/project-context')
        const context = await collectProjectContext(project, signal)
        signal.throwIfAborted()
        progress({ phase: `Understanding ${project.name} with AI`, files: 0, total: 1 })
        const { analyzeProjectWithAI } = await import('../ai/project-understanding')
        const analysis = await analyzeProjectWithAI(request, context, key, signal)
        signal.throwIfAborted()
        return store.projects.saveAnalysis(project.id, analysis)
      }),
  }
}
