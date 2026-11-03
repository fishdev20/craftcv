import { createHash, randomUUID } from 'node:crypto'
import type { Evidence, Session, Suggestion } from '../../shared/contracts'
// Explicit vocabulary keeps extraction reproducible and prevents keyword hallucination.
export const skills: Record<string, RegExp> = {
  TypeScript: /\btypescript\b|\b(?:interface|type)\s+\w+\s*[={]|:\s*(?:string|number|boolean)\b/i,
  JavaScript: /\bjavascript\b|\b(?:const|let|function)\s+\w+/i,
  React: /\breact\b|\buse(?:State|Effect|Memo|Callback)\s*\(/i,
  Python: /\bpython\b|\bdef\s+\w+\(|\bfrom\s+\w+\s+import\b/i,
  'Node.js': /\bnode(?:\.js|:)\b|\brequire\s*\(/i,
  SQL: /\bsql(?:ite)?\b|\bSELECT\s+.+\s+FROM\b|\bCREATE\s+TABLE\b/i,
  PostgreSQL: /\bpostgres(?:ql)?\b|\bpg\b/i,
  Testing: /\b(?:vitest|jest|pytest|playwright|testing|tests?)\b|\b(?:it|describe)\s*\(/i,
  Docker: /\bdocker\b|^FROM\s+\w+/im,
  Kubernetes: /\bkubernetes\b|\bk8s\b/i,
  'CI/CD': /\bci\/cd\b|\bcontinuous integration\b|\bactions\/checkout\b/i,
  Accessibility: /\baccessibility\b|\baria-\w+|\bwcag\b/i,
  REST: /\brest(?:ful)?\b|\bapp\.(?:get|post|put|delete)\s*\(/i,
  GraphQL: /\bgraphql\b/i,
  AWS: /\baws\b|\bamazon web services\b|@aws-sdk/i,
  Git: /\bgit\b|\bgithub\b/i,
  CSS: /\bcss\b|\btailwind\b|\bdisplay\s*:\s*(?:flex|grid)/i,
  Security: /\bsecurity\b|\bcsrf\b|\bcontextIsolation\b|\bhelmet\b/i,
  Authentication: /\bauthentication\b|\boauth\b|\bjwt\b/i,
  Rust: /\brust\b|\bfn\s+\w+\(/i,
  Go: /\bgolang\b|\bgo\b|\bfunc\s+\w+\(/i,
  Java: /\bjava\b|\bpublic\s+class\b/i,
  Performance: /\bperformance\b|\bbenchmark\b|\bprofiling\b/i,
}
export function requirements(job: string): string[] {
  return Object.entries(skills)
    .filter(([, pattern]) => pattern.test(job))
    .map(([name]) => name)
}
export function extractEvidence(text: string, path: string, repositoryId: string): Evidence[] {
  const hash = createHash('sha256').update(text).digest('hex')
  const lines = text.split('\n')
  const hits = Object.entries(skills).flatMap(([skill, pattern]) => {
    const line = lines.findIndex((l) => pattern.test(l))
    if (line < 0) return []
    const start = Math.max(0, line - 1)
    const column = pattern.exec(lines[line])?.index ?? 0
    const snippet = [
      ...(line > 0 ? [lines[line - 1].slice(0, 200)] : []),
      lines[line].slice(Math.max(0, column - 150), column + 600),
      ...(line + 1 < lines.length ? [lines[line + 1].slice(0, 200)] : []),
    ].join('\n')
    return [
      {
        id: createHash('sha256')
          .update(`${repositoryId}:${path}:${skill}:${hash}`)
          .digest('hex')
          .slice(0, 24),
        repositoryId,
        path,
        line: start + 1,
        snippet,
        skills: [skill],
        hash,
      },
    ]
  })
  return hits.slice(0, 8)
}
export function localSuggestions(
  sessionId: string,
  requested: string[],
  evidence: Evidence[],
): Suggestion[] {
  return requested.flatMap((requirement) => {
    const match = evidence.find((e) => e.skills.includes(requirement))
    if (!match) return []
    return [
      {
        id: randomUUID(),
        sessionId,
        requirement,
        text: `Worked with ${requirement} in project source code.`,
        evidenceIds: [match.id],
        warnings: [],
        status: 'pending' as const,
      },
    ]
  })
}
export function validateClaim(text: string, evidenceIds: string[], evidence: Evidence[]): string[] {
  const cited = evidence.filter((e) => evidenceIds.includes(e.id))
  const warnings: string[] = []
  if (!cited.length || cited.length !== new Set(evidenceIds).size)
    warnings.push('Missing or invalid source references.')
  if (
    /\d|%|\b(?:doubled|tripled|million|billion|increased|reduced|improved|faster|saved|led|owned|managed|architected)\b/i.test(
      text,
    )
  )
    warnings.push('Quantified impact, ownership, or achievement needs independent verification.')
  const supported = new Set(cited.flatMap((e) => e.skills))
  for (const skill of requirements(text))
    if (!supported.has(skill)) warnings.push(`${skill} is not supported by the cited evidence.`)
  return warnings
}
export function relevance(session: Session): {
  score: number
  matched: string[]
  missing: string[]
} {
  const approved = session.suggestions.filter((s) => s.status === 'approved')
  const matched = session.requirements.filter((r) =>
    approved.some(
      (s) =>
        s.requirement === r &&
        s.evidenceIds.some((id) =>
          session.evidence.some((e) => e.id === id && e.skills.includes(r)),
        ),
    ),
  )
  return {
    score: session.requirements.length
      ? Math.round((matched.length / session.requirements.length) * 100)
      : 0,
    matched,
    missing: session.requirements.filter((r) => !matched.includes(r)),
  }
}
