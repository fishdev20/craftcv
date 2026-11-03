import Database from 'better-sqlite3'
import { afterEach, expect, it } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../src/main/storage/store'

const directories: string[] = []
afterEach(async () => {
  await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true })))
})

it('groups legacy one-repository Kaira projects during migration', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'craftcv-database-'))
  directories.push(directory)
  const path = join(directory, 'craftcv.sqlite')
  const database = new Database(path)
  database.exec(`
    CREATE TABLE projects(id TEXT PRIMARY KEY,name TEXT NOT NULL,root_path TEXT NOT NULL UNIQUE,analysis TEXT);
    CREATE TABLE repositories(id TEXT PRIMARY KEY,name TEXT NOT NULL,path TEXT NOT NULL UNIQUE,project_id TEXT REFERENCES projects(id));
    INSERT INTO projects VALUES('p1','kaira / kaira','/projects/kaira/kaira',NULL);
    INSERT INTO projects VALUES('p2','kaira / kaira-api','/projects/kaira/kaira-api',NULL);
    INSERT INTO repositories VALUES('r1','kaira / kaira','/projects/kaira/kaira','p1');
    INSERT INTO repositories VALUES('r2','kaira / kaira-api','/projects/kaira/kaira-api','p2');
    PRAGMA user_version=3;
  `)
  database.close()
  const store = new Store(path)
  expect(store.projects.list()).toMatchObject([
    {
      name: 'kaira',
      rootPath: '/projects/kaira',
      repositories: [{ id: 'r1' }, { id: 'r2' }],
    },
  ])
  store.close()
})
