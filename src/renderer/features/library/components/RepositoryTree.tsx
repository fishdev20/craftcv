import { Disclosure } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import type { RepositoryNode } from '../repository-tree'

/** A project's repositories nested by folder, every folder open to start with. */
export default function RepositoryTree({ nodes }: { nodes: RepositoryNode[] }) {
  return (
    <ul className="repo-tree">
      {nodes.map((node) => (
        <li key={node.key}>
          {node.kind === 'repository' ? (
            <span className="repo-tree-leaf" title={node.repository.path}>
              <Icon icon="lucide:git-branch" width={13} />
              {node.label}
            </span>
          ) : (
            <Disclosure className="repo-tree-group" defaultExpanded>
              <Disclosure.Heading>
                <Disclosure.Trigger className="repo-tree-trigger">
                  <Disclosure.Indicator />
                  <Icon icon="lucide:folder" width={13} />
                  {node.label}
                  {node.count !== undefined && (
                    <span className="repo-tree-count">{node.count}</span>
                  )}
                </Disclosure.Trigger>
              </Disclosure.Heading>
              <Disclosure.Content>
                <Disclosure.Body>
                  <RepositoryTree nodes={node.children} />
                </Disclosure.Body>
              </Disclosure.Content>
            </Disclosure>
          )}
        </li>
      ))}
    </ul>
  )
}
