import { useState } from 'react'
import { Button, Disclosure, Spinner, Typography } from '@heroui/react'
import { documentsApi } from '@/features/documents/api'
type Preview =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; text: string }
  | { status: 'error'; error: string }
/** A CV's extracted text, loaded the first time it is opened. */
export default function ResumePreview({ id, name }: { id: string; name: string }) {
  const [preview, setPreview] = useState<Preview>({ status: 'idle' })
  const load = async () => {
    setPreview({ status: 'loading' })
    try {
      const resume = await documentsApi.get(id)
      setPreview({ status: 'ready', text: resume.text })
    } catch (error) {
      setPreview({
        status: 'error',
        error: error instanceof Error ? error.message : 'Could not load this CV.',
      })
    }
  }
  return (
    <Disclosure
      className="resume-preview"
      onExpandedChange={(expanded) => {
        if (expanded && preview.status === 'idle') void load()
      }}
    >
      <Disclosure.Heading>
        <Disclosure.Trigger>
          {name}
          <Disclosure.Indicator />
        </Disclosure.Trigger>
      </Disclosure.Heading>
      <Disclosure.Content>
        <Disclosure.Body>
          {preview.status === 'ready' ? (
            <pre className="resume-text">{preview.text || 'This document is empty.'}</pre>
          ) : preview.status === 'error' ? (
            <div>
              <Typography.Paragraph size="sm" role="alert">
                {preview.error}
              </Typography.Paragraph>
              <Button size="sm" variant="outline" onClick={() => void load()}>
                Retry preview
              </Button>
            </div>
          ) : (
            <Typography.Paragraph size="sm" role="status" className="loading-inline">
              <Spinner aria-hidden="true" size="sm" />
              Loading CV…
            </Typography.Paragraph>
          )}
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  )
}
