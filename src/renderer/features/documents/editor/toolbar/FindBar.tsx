import { useEffect, useRef, useState } from 'react'
import { useEditorState, type Editor } from '@tiptap/react'
import { Button, Input, TextField, ToggleButton } from '@heroui/react'
import { Icon } from '@/common/ui/icons'
import { replaceAll, replaceCurrent, searchState, setSearch, stepSearch } from '../extensions'

/** Finds text in the document, steps through the matches, and replaces one or all. */
export default function FindBar({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const search = useEditorState({ editor, selector: ({ editor: e }) => searchState(e) })
  const [replacement, setReplacement] = useState('')
  const field = useRef<HTMLInputElement>(null)
  // Escape closes find wherever focus is, as after Replace all disables the buttons
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        editor.commands.focus()
      }
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [editor, onClose])
  useEffect(() => {
    field.current?.focus()
    field.current?.select()
    // matches stop showing once the bar closes
    return () => setSearch(editor, { term: '' })
  }, [editor])
  const count = search.matches.length
  const close = () => {
    onClose()
    editor.commands.focus()
  }
  return (
    <form
      className="editor-find-bar"
      role="search"
      aria-label="Find and replace"
      onSubmit={(event) => {
        event.preventDefault()
        stepSearch(editor, 1)
      }}
    >
      <TextField
        aria-label="Find"
        value={search.term}
        onChange={(term) => setSearch(editor, { term, current: 0 })}
        className="editor-find-field"
      >
        <Input ref={field} placeholder="Find in document" />
      </TextField>
      <span className="editor-find-count" aria-live="polite">
        {search.term ? (count ? `${search.current + 1} of ${count}` : 'No matches') : ''}
      </span>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Previous match"
        isDisabled={!count}
        onPress={() => stepSearch(editor, -1)}
      >
        <Icon icon="lucide:chevron-up" width={15} />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Next match"
        isDisabled={!count}
        onPress={() => stepSearch(editor, 1)}
      >
        <Icon icon="lucide:chevron-down" width={15} />
      </Button>
      <ToggleButton
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Match case"
        isSelected={search.caseSensitive}
        onChange={(caseSensitive) => setSearch(editor, { caseSensitive })}
      >
        <Icon icon="lucide:case-sensitive" width={16} />
      </ToggleButton>
      <TextField
        aria-label="Replace with"
        value={replacement}
        onChange={setReplacement}
        className="editor-find-field"
      >
        <Input placeholder="Replace with" />
      </TextField>
      <Button
        size="sm"
        variant="outline"
        isDisabled={!count}
        onPress={() => replaceCurrent(editor, replacement)}
      >
        <Icon icon="lucide:replace" width={14} />
        Replace
      </Button>
      <Button
        size="sm"
        variant="outline"
        isDisabled={!count}
        onPress={() => replaceAll(editor, replacement)}
      >
        <Icon icon="lucide:replace-all" width={14} />
        All
      </Button>
      <Button isIconOnly size="sm" variant="ghost" aria-label="Close find" onPress={close}>
        <Icon icon="lucide:x" width={15} />
      </Button>
    </form>
  )
}
