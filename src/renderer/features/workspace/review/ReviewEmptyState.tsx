import { EmptyState, Typography } from '@heroui/react'
import { Icon } from '@/common/ui/icons'

const promises = [
  ['lucide:code-xml', 'Relevant skills from your actual code'],
  ['lucide:git-branch', 'Source files you can inspect'],
  ['lucide:check', 'Every bullet reviewed by you'],
]

export default function ReviewEmptyState() {
  return (
    <EmptyState className="review-empty">
      <div className="document-symbol">
        <Icon icon="lucide:file-text" width={36} />
        <span>
          <Icon icon="lucide:check" width={14} />
        </span>
      </div>
      <Typography.Heading level={3}>Your evidence review starts here</Typography.Heading>
      <Typography.Paragraph size="sm">
        Choose project evidence and add the role requirements. CraftCV will return editable
        suggestions with the source files behind each claim.
      </Typography.Paragraph>
      <div className="empty-steps">
        {promises.map(([icon, text]) => (
          <div key={text}>
            <Icon icon={icon} width={17} />
            <span>{text}</span>
          </div>
        ))}
      </div>
      <span className="empty-footnote">Nothing reaches a document until you approve it.</span>
    </EmptyState>
  )
}
