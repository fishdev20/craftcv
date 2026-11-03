import { Typography } from '@heroui/react'
import type { Project } from '@shared/contracts'

/** The detail of an AI understanding (its summary and technologies show on the project card). */
export default function ProjectAnalysis({
  analysis,
}: {
  analysis: NonNullable<Project['analysis']>
}) {
  return (
    <div className="project-analysis">
      <dl>
        <div>
          <dt>Architecture</dt>
          <dd>{analysis.architecture}</dd>
        </div>
      </dl>
      <Typography.Heading level={3}>Service map</Typography.Heading>
      {analysis.services.map((service) => (
        <div className="service-analysis" key={service.name}>
          <strong>{service.name}</strong>
          <Typography.Paragraph size="sm">{service.purpose}</Typography.Paragraph>
          {service.evidencePaths.length > 0 && <code>{service.evidencePaths.join(' · ')}</code>}
        </div>
      ))}
      {analysis.unknowns.length > 0 && (
        <Typography.Paragraph size="sm" className="claim-note">
          Unknown: {analysis.unknowns.join(' ')}
        </Typography.Paragraph>
      )}
      <small>
        Generated with {analysis.provider} / {analysis.model} on{' '}
        {new Date(analysis.analyzedAt).toLocaleString()}.
      </small>
    </div>
  )
}
