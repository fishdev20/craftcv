import { useState } from 'react'
import type { Editor } from '@tiptap/react'
import { Button, FieldError, Input, Label, TextField } from '@heroui/react'
import { safeLink } from '@shared/document'

/** Sets, changes or removes the link on the selection. */
export default function LinkForm({
  editor,
  initialHref,
  onClose,
}: {
  editor: Editor
  initialHref: string
  onClose: () => void
}) {
  const [href, setHref] = useState(initialHref),
    [error, setError] = useState('')
  return (
    <form
      className="editor-link-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!safeLink(href)) {
          setError('Use a complete https://, http://, or mailto: link.')
          return
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
        onClose()
      }}
    >
      <TextField
        className="editor-link-field"
        value={href}
        onChange={setHref}
        isInvalid={!!error}
        autoFocus
      >
        <Label>Link address</Label>
        <Input placeholder="https://example.com" />
        <FieldError>{error}</FieldError>
      </TextField>
      <Button size="sm" type="submit">
        Apply link
      </Button>
      <Button
        size="sm"
        variant="outline"
        type="button"
        onClick={() => {
          editor.chain().focus().extendMarkRange('link').unsetLink().run()
          onClose()
        }}
      >
        Remove link
      </Button>
      <Button size="sm" variant="ghost" type="button" onClick={onClose}>
        Cancel
      </Button>
    </form>
  )
}
