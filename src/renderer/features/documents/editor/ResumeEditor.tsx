import { useState } from 'react'
import { EditorContent } from '@tiptap/react'
import type { Resume } from '@shared/contracts'
import Loading from '@/common/ui/Loading'
import { useDocuments } from '../drafts-store'
import EditorHeader from './EditorHeader'
import EditorStatusbar from './EditorStatusbar'
import SaveErrorAlert from './SaveErrorAlert'
import EditorToolbar from './toolbar/EditorToolbar'
import { useResumeEditor } from './useResumeEditor'

/** The editor for a document whose draft is open. */
export default function ResumeEditor({ resume }: { resume: Resume }) {
  const draft = useDocuments((s) => s.drafts[resume.id])!
  const editor = useResumeEditor(resume)
  const [zoom, setZoom] = useState('100')
  if (!editor) return <Loading label="Opening document…" />
  return (
    <main className="document-editor">
      <EditorHeader draft={draft} />
      {draft.error && <SaveErrorAlert draft={draft} />}
      <EditorToolbar editor={editor} />
      <div className="editor-canvas">
        <div className="editor-page-container" style={{ zoom: Number(zoom) / 100 }}>
          <EditorContent editor={editor} />
        </div>
      </div>
      <EditorStatusbar document={draft.resume.document} zoom={zoom} onZoom={setZoom} />
    </main>
  )
}
