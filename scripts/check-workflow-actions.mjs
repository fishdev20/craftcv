import { readdir, readFile } from 'node:fs/promises'
import { URL } from 'node:url'

const directory = new URL('../.github/workflows/', import.meta.url)
const files = (await readdir(directory)).filter((file) => /\.ya?ml$/i.test(file))
const failures = []

for (const file of files) {
  const source = await readFile(new URL(file, directory), 'utf8')
  if (/^\s*pull_request_target\s*:/m.test(source))
    failures.push(
      `${file}: pull_request_target is forbidden for workflows that execute repository code`,
    )
  if (/^\s*permissions\s*:\s*write-all\s*$/m.test(source))
    failures.push(`${file}: write-all permissions are forbidden`)

  for (const match of source.matchAll(/^\s*-\s+uses:\s*([^\s#]+)/gm)) {
    const action = match[1]
    if (action.startsWith('./') || action.startsWith('docker://')) continue
    const separator = action.lastIndexOf('@')
    const ref = separator === -1 ? '' : action.slice(separator + 1)
    if (!/^[0-9a-f]{40}$/i.test(ref))
      failures.push(`${file}: ${action} must be pinned to a full commit SHA`)
  }
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Workflow security check passed for ${files.length} files.`)
}
