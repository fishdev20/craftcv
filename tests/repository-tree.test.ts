import { it, expect } from 'vitest'
import {
  repositoryTree,
  type RepositoryNode,
} from '../src/renderer/features/library/repository-tree'

const root = '/Users/me/git/kaira'
const repository = (path: string) => ({
  id: path,
  name: `kaira / ${path}`,
  path: path ? `${root}/${path}` : root,
  projectId: 'p',
})
const outline = (node: RepositoryNode): unknown =>
  node.kind === 'group'
    ? {
        [`${node.label}${node.count === undefined ? '' : ` (${node.count})`}`]:
          node.children.map(outline),
      }
    : node.label

it('roots the tree at the project folder and lists repositories by name, ungrouped', () => {
  const names = [
    'kaira-microservice-forestgrid',
    'kaira-iac',
    'kaira',
    'kaira-microservice-parameter',
  ]
  expect(outline(repositoryTree({ rootPath: root, repositories: names.map(repository) }))).toEqual({
    'kaira/': [
      'kaira',
      'kaira-iac',
      'kaira-microservice-forestgrid',
      'kaira-microservice-parameter',
    ],
  })
})

it('nests repositories in sub-folders, and names a repository at the root after the project', () => {
  const paths = ['', 'services/web', 'services/api', 'tools/cli']
  expect(
    outline(repositoryTree({ rootPath: `${root}/`, repositories: paths.map(repository) })),
  ).toEqual({ 'kaira/': ['kaira', { 'services/ (2)': ['api', 'web'] }, { 'tools/ (1)': ['cli'] }] })
})
