import { readFile } from 'node:fs/promises'

const requiredHandoffSections = [
  '## Product direction',
  '## Current state',
  '## Active handoff',
  '## Open items',
  '## Decisions',
  '## Checks',
]

const [claudeInstructions, agentInstructions, handoff] = await Promise.all([
  readFile('CLAUDE.md', 'utf8'),
  readFile('AGENTS.md', 'utf8'),
  readFile('docs/handoff.md', 'utf8'),
])

const problems = []

if (!claudeInstructions.split(/\r?\n/u).includes('@AGENTS.md')) {
  problems.push('CLAUDE.md must import @AGENTS.md.')
}

if (!agentInstructions.includes('docs/handoff.md')) {
  problems.push('AGENTS.md must direct agents to docs/handoff.md.')
}

for (const section of requiredHandoffSections) {
  if (!handoff.includes(section)) {
    problems.push(`docs/handoff.md is missing ${section}.`)
  }
}

if (problems.length > 0) {
  console.error(`Shared agent context is incomplete:\n- ${problems.join('\n- ')}`)
  process.exitCode = 1
} else {
  console.log('Shared agent context is connected for Codex and Claude Code.')
}
