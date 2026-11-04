import type { Resume } from '@shared/contracts'
import { action, notify, refreshDashboard } from '@/common/store/app-store'
import { forgetResume } from '@/features/workspace/store'
import { documentsApi, type ExportFormat } from './api'
import { deleteDocument, flushDraft, forgetDraft, openDraft } from './drafts-store'
import { documentTemplate, type DocumentTemplateId } from './templates'

/** Creates a blank document, or one built from a session's approved bullets. */
export const createDocument = (sessionId: string | null = null) =>
  action(async () => {
    const resume = await documentsApi.create(sessionId)
    await refreshDashboard()
    return resume
  })

/** Creates a normal editable document from one of CraftCV's built-in starter layouts. */
export const createDocumentFromTemplate = (templateId: DocumentTemplateId) =>
  action(async () => {
    const template = documentTemplate(templateId)
    const blank = await documentsApi.create(null)
    let resume: Resume
    try {
      resume = await documentsApi.save({
        id: blank.id,
        name: template.documentName,
        document: template.createDocument(),
        revision: blank.revision,
      })
    } catch (error) {
      await documentsApi.remove(blank.id).catch(() => {})
      throw error
    }
    await refreshDashboard()
    return resume
  })

/** Asks for a CV file; resolves to the imported document, or null when the dialog is cancelled. */
export const importDocument = () =>
  action(async () => {
    const resume = await documentsApi.import()
    if (resume) await refreshDashboard()
    return resume
  })

export const saveDocument = (id: string) => action(() => flushDraft(id))

export const exportDocument = (id: string, format: ExportFormat) =>
  action(async () => {
    await flushDraft(id)
    const path = await documentsApi.export(id, format)
    if (path) notify(`Document exported to ${path}`)
  })

/** Saves a draft that could not be saved as a new document instead; resolves to the copy. */
export const saveDocumentCopy = (draft: Resume) =>
  action(async () => {
    const copy = await documentsApi.create(null)
    const saved = await documentsApi.save({
      id: copy.id,
      name: ((draft.name || 'Resume') + ' copy').slice(0, 200),
      document: draft.document,
      revision: copy.revision,
    })
    forgetDraft(draft.id)
    openDraft(saved)
    await refreshDashboard()
    return saved
  })

export const removeDocument = (id: string) =>
  action(async () => {
    await deleteDocument(id)
    forgetResume(id)
    await refreshDashboard()
  })
