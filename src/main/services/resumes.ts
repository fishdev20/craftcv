import type { Resume, SaveResumeRequest } from '../../shared/contracts'
import { approvedSuggestions } from '../domain/session'
import { tailoredDocument } from '../domain/tailored-document'
import type { ServiceDeps } from './deps'

export type ExportFormat = 'pdf' | 'docx'

/** CVs: imported files, blank documents, and documents tailored from a session. */
export function createResumeService({ store, paths, operations, window }: ServiceDeps) {
  return {
    import: () =>
      operations.run(async (signal) => {
        const { importDocument } = await import('../documents/document-files')
        const doc = await importDocument(window(), paths.worker('document'), signal)
        if (!doc) return null
        if (doc.document)
          try {
            return store.resumes.addDocument(doc.name, doc.document)
          } catch {
            // a layout beyond the editor's limits is kept as its text instead
          }
        return store.resumes.addText(doc.name, doc.text)
      }),

    get(id: string): Resume {
      const resume = store.resumes.get(id)
      if (!resume) throw new Error('CV not found.')
      return resume
    },

    remove(id: string) {
      operations.assertIdle()
      store.resumes.remove(id)
    },

    /** A blank document, or the session's CV with its approved bullets appended. */
    create(sessionId: string | null): Resume {
      if (!sessionId) return store.resumes.addText('Untitled resume', '')
      const session = store.sessions.get(sessionId)
      const approved = approvedSuggestions(session)
      if (!approved.length)
        throw new Error('Approve at least one bullet before creating a document.')
      const base = session.resumeId ? store.resumes.get(session.resumeId) : undefined
      const { name, document } = tailoredDocument(base, approved)
      return store.resumes.addDocument(name, document)
    },

    save: (request: SaveResumeRequest) => store.resumes.save(request),

    export: (id: string, format: ExportFormat) =>
      operations.run(async (signal) => {
        const resume = store.resumes.get(id)
        if (!resume) throw new Error('Document not found.')
        const { exportEditedDocument } = await import('../documents/document-files')
        return exportEditedDocument(window(), paths.worker('document'), resume, format, signal)
      }),
  }
}
