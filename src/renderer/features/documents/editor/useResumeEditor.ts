import { useEffect } from 'react'
import { useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import { TextStyleKit } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import type { Resume } from '@shared/contracts'
import { safeLink, type DocumentNode } from '@shared/document'
import { saveDocument } from '../actions'
import { editDraft } from '../drafts-store'
import { PageBreak, PagedDocument, Pages } from './pages'

/** The extensions the export model understands, and nothing more. */
const extensions = [
  StarterKit.configure({
    // replaced by PagedDocument, which keeps the page layout
    document: false,
    code: false,
    codeBlock: false,
    heading: { levels: [1, 2, 3] },
    link: { openOnClick: false, autolink: false, isAllowedUri: safeLink },
  }),
  TableKit.configure({ table: { resizable: false } }),
  TextStyleKit.configure({ lineHeight: false, backgroundColor: false }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  PagedDocument,
  PageBreak,
  Pages,
]

/** A Tiptap editor on the resume's draft, with Ctrl/⌘ S to save. */
export function useResumeEditor(resume: Resume) {
  const editor = useEditor(
    {
      extensions,
      content: resume.document,
      editorProps: {
        attributes: {
          class: 'resume-paper rich-document',
          role: 'textbox',
          'aria-label': 'Resume document',
          'aria-multiline': 'true',
          spellcheck: 'true',
        },
        handleDOMEvents: {
          // links are edited, not followed
          click: (_view, event) => {
            if ((event.target as HTMLElement).closest('a')) {
              event.preventDefault()
              return true
            }
            return false
          },
        },
      },
      onUpdate: ({ editor: e }) => editDraft(resume.id, { document: e.getJSON() as DocumentNode }),
    },
    [resume.id],
  )
  useEffect(() => {
    if (!editor) return
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveDocument(resume.id)
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [editor, resume.id])
  return editor
}
