import type { Session } from '@shared/contracts'

/** A source excerpt, labelled with its project, repository, file and line. */
export default function EvidenceSnippet({
  evidence: e,
}: {
  evidence: Session['evidence'][number]
}) {
  return (
    <div className="evidence">
      <code>
        {e.projectName ? `${e.projectName} / ` : ''}
        {e.repositoryName ? `${e.repositoryName} / ` : ''}
        {e.path}:{e.line}
      </code>
      <pre>{e.snippet}</pre>
    </div>
  )
}
