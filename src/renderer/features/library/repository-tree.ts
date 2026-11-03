import type { Project, Repository } from '@shared/contracts'

export type RepositoryNode =
  | { kind: 'repository'; key: string; label: string; repository: Repository }
  | {
      kind: 'group'
      key: string
      label: string
      /** Repositories inside, for sub-folders; the project's own folder shows none. */
      count?: number
      children: RepositoryNode[]
    }

type Folder = { folders: Map<string, Folder>; repositories: [string, Repository][] }

const segments = (path: string) => path.split(/[\\/]+/).filter(Boolean)

/** The repository's folders below the project root, and its own folder name. */
function placement(root: string, repository: Repository): [string[], string] {
  const rootParts = segments(root),
    parts = segments(repository.path)
  const inside = rootParts.every((part, index) => parts[index] === part)
  const relative = inside ? parts.slice(rootParts.length) : [parts.at(-1) ?? repository.name]
  // the root itself can be a repository; it is named after the project
  return relative.length
    ? [relative.slice(0, -1), relative.at(-1)!]
    : [[], rootParts.at(-1) ?? repository.name]
}

const byLabel = (a: RepositoryNode, b: RepositoryNode) =>
  a.label.localeCompare(b.label, undefined, { numeric: true })

const total = (nodes: RepositoryNode[]): number =>
  nodes.reduce((sum, node) => sum + (node.kind === 'group' ? (node.count ?? 0) : 1), 0)

function toNodes(folder: Folder, key: string): RepositoryNode[] {
  const nodes: RepositoryNode[] = [...folder.folders].map(([name, child]) => {
    const children = toNodes(child, `${key}/${name}`)
    return {
      kind: 'group',
      key: `${key}/${name}`,
      label: `${name}/`,
      count: total(children),
      children,
    }
  })
  const repositories: RepositoryNode[] = folder.repositories.map(([label, repository]) => ({
    kind: 'repository',
    key: repository.id,
    label,
    repository,
  }))
  return [...nodes, ...repositories].sort(byLabel)
}

type RepositoryFolder = Extract<RepositoryNode, { kind: 'group' }>

/** A project's repositories as a tree of its folders, rooted at the project's own folder. */
export function repositoryTree(
  project: Pick<Project, 'rootPath' | 'repositories'>,
): RepositoryFolder {
  const root: Folder = { folders: new Map(), repositories: [] }
  for (const repository of project.repositories) {
    const [folders, name] = placement(project.rootPath, repository)
    let folder = root
    for (const part of folders) {
      if (!folder.folders.has(part))
        folder.folders.set(part, { folders: new Map(), repositories: [] })
      folder = folder.folders.get(part)!
    }
    folder.repositories.push([name, repository])
  }
  const children = toNodes(root, '')
  const name = segments(project.rootPath).at(-1) ?? ''
  return { kind: 'group', key: '/', label: `${name}/`, children }
}
