import { Button, Description, InputGroup, Label, TextField, Typography } from '@heroui/react'
import { useState } from 'react'
import { useAppStore } from '@/common/store/app-store'
import ActionIcon from '@/common/ui/ActionIcon'
import { Icon } from '@/common/ui/icons'
import { usePendingAction } from '@/common/ui/usePendingAction'
import { closeJobPage, importJobLink, openJobPage, takeJobPage } from '../actions'

/**
 * Fills the job description from a posting's link, read by the main process. When a site
 * blocks that, the person can open the posting in a window of its own and use the page.
 */
export default function JobLinkField({ onImported }: { onImported?: () => void }) {
  const busy = useAppStore((s) => s.busy),
    [link, setLink] = useState(''),
    // the link last tried could not be read, so it may be opened instead
    [failed, setFailed] = useState(false),
    [pageOpen, setPageOpen] = useState(false)
  const { pending, run } = usePendingAction()

  const done = () => {
    setLink('')
    setFailed(false)
    setPageOpen(false)
    onImported?.()
  }

  return (
    <form
      className="job-link"
      onSubmit={(event) => {
        event.preventDefault()
        if (link.trim())
          void run('import', () => importJobLink(link)).then((imported) =>
            imported ? done() : setFailed(true),
          )
      }}
    >
      <TextField
        type="url"
        value={link}
        onChange={(value) => {
          setLink(value)
          setFailed(false)
        }}
        isDisabled={busy || pageOpen}
        autoComplete="off"
        fullWidth
      >
        <Label>Job posting link</Label>
        <InputGroup fullWidth>
          <InputGroup.Prefix>
            <Icon icon="lucide:link-2" width={15} />
          </InputGroup.Prefix>
          <InputGroup.Input spellCheck={false} placeholder="https://…" />
          <InputGroup.Suffix>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              isPending={pending === 'import'}
              isDisabled={busy || pageOpen || !link.trim()}
            >
              <ActionIcon pending={pending === 'import'} icon="lucide:download" width={14} />
              {pending === 'import' ? 'Importing…' : 'Import'}
            </Button>
          </InputGroup.Suffix>
        </InputGroup>
        <Description>
          Works with LinkedIn, Indeed, Greenhouse, Lever, Ashby, Workday, SmartRecruiters, Workable
          and most career pages.
        </Description>
      </TextField>
      {failed && !pageOpen && (
        <div className="job-page-offer">
          <Typography.Paragraph size="sm">
            Some sites, like Indeed and Glassdoor, don’t let apps read their pages.
          </Typography.Paragraph>
          <Button
            size="sm"
            variant="secondary"
            isPending={pending === 'open'}
            isDisabled={busy}
            onPress={() =>
              void run('open', openJobPage).then((opened) => setPageOpen(Boolean(opened)))
            }
          >
            <ActionIcon pending={pending === 'open'} icon="lucide:arrow-up-right" width={14} />
            {pending === 'open' ? 'Opening…' : 'Open the posting'}
          </Button>
        </div>
      )}
      {pageOpen && (
        <div className="job-page-bar" role="status">
          <Typography.Paragraph size="sm">
            The posting is open in its own window. Sign in there if the site asks, and when the job
            shows, use the page here.
          </Typography.Paragraph>
          <div className="job-page-actions">
            <Button
              size="sm"
              isPending={pending === 'use'}
              isDisabled={busy}
              onPress={() =>
                void run('use', takeJobPage).then((taken) => {
                  if (taken) done()
                })
              }
            >
              <ActionIcon pending={pending === 'use'} icon="lucide:check" width={14} />
              {pending === 'use' ? 'Reading page…' : 'Use this page'}
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={busy}
              onPress={() => {
                setPageOpen(false)
                void closeJobPage()
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
