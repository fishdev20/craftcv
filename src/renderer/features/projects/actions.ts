import type { Project, Provider } from '@shared/contracts'
import { action, busyAction, notify, refreshDashboard, setProgress } from '@/common/store/app-store'
import { addSelectedProject, forgetProject } from '@/features/workspace/store'
import { projectsApi } from './api'

/** Adds one Git repository, or a folder of services, as a project, and selects it. */
export async function importRepositories(source: 'repository' | 'folder' = 'folder') {
  await busyAction(
    async () => {
      const result =
        source === 'repository'
          ? await projectsApi.selectRepository()
          : await projectsApi.importFolder()
      if (!result) return
      await refreshDashboard()
      addSelectedProject(result.project.id)
      notify(
        [
          `${result.project.name} added as one project with ${result.repositories.length} services. ${result.added} repositories added.`,
          result.skipped
            ? `${result.skipped} services were not added because the 25-repository library limit was reached.`
            : '',
          result.limited
            ? 'Discovery reached its depth or size limit. Import a more specific subfolder to find remaining services.'
            : '',
          result.unreadable
            ? `${result.unreadable} folders or Git roots could not be inspected.`
            : '',
        ]
          .filter(Boolean)
          .join(' '),
      )
    },
    { phase: 'Choose a services folder', files: 0, total: 0 },
  )
}

type Request = { provider: Provider; model: string }

const analyze = (project: Project, { provider, model }: Request) =>
  projectsApi.analyze({ projectId: project.id, provider, model, consent: true, tokenBudget: null })

/** One AI understanding request per project, in turn, with progress. */
export async function understandProjects(projects: Project[], request: Request) {
  const total = projects.length
  const completed = await busyAction(
    async () => {
      let count = 0
      for (const project of projects) {
        setProgress({ phase: `Understanding ${project.name}`, files: count, total })
        await analyze(project, request)
        count += 1
      }
      return count
    },
    { phase: 'Preparing project understanding', files: 0, total },
  )
  await refreshDashboard()
  if (completed !== undefined)
    notify(`AI understanding updated for ${completed} ${completed === 1 ? 'project' : 'projects'}.`)
}

export async function understandProject(project: Project, request: Request) {
  await busyAction(async () => {
    await analyze(project, request)
    await refreshDashboard()
    notify(`${project.name} project understanding updated.`)
  })
}

export const removeProject = (id: string) =>
  action(async () => {
    await projectsApi.remove(id)
    forgetProject(id)
    await refreshDashboard()
  })
