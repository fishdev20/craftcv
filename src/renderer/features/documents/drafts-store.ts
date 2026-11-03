import { create } from 'zustand'
import type { Resume } from '@shared/contracts'
import type { DocumentNode } from '@shared/document'
import { showError, useAppStore } from '@/common/store/app-store'
import { documentsApi } from './api'

export type Draft = {
  resume: Resume
  generation: number
  dirty: boolean
  saving: boolean
  error: string | null
}
/** Each open document's edits, saved 600ms after the last change. */
export const useDocuments = create<{ drafts: Record<string, Draft> }>(() => ({ drafts: {} }))
const timers = new Map<string, ReturnType<typeof setTimeout>>()
const requests = new Map<string, Promise<void>>()
function setDraft(id: string, draft: Draft) {
  useDocuments.setState((state) => ({ drafts: { ...state.drafts, [id]: draft } }))
}
export function openDraft(resume: Resume) {
  const existing = useDocuments.getState().drafts[resume.id]
  if (!existing?.dirty && !existing?.saving)
    setDraft(resume.id, { resume, generation: 0, dirty: false, saving: false, error: null })
}
export function forgetDraft(id: string) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  useDocuments.setState((state) => ({
    drafts: Object.fromEntries(Object.entries(state.drafts).filter(([key]) => key !== id)),
  }))
}
export async function deleteDocument(id: string) {
  clearTimeout(timers.get(id))
  timers.delete(id)
  await requests.get(id)?.catch(() => {})
  await documentsApi.remove(id)
  forgetDraft(id)
}
export function editDraft(id: string, patch: { name?: string; document?: DocumentNode }) {
  const draft = useDocuments.getState().drafts[id]
  if (!draft) return
  setDraft(id, {
    ...draft,
    resume: { ...draft.resume, ...patch },
    generation: draft.generation + 1,
    dirty: true,
    error: null,
  })
  clearTimeout(timers.get(id))
  timers.set(
    id,
    setTimeout(() => {
      void flushDraft(id).catch(() => {})
    }, 600),
  )
}
export async function flushDraft(id: string): Promise<void> {
  clearTimeout(timers.get(id))
  timers.delete(id)
  if (requests.has(id)) {
    await requests.get(id)
    return flushDraft(id)
  }
  const draft = useDocuments.getState().drafts[id]
  if (!draft?.dirty) return
  setDraft(id, { ...draft, saving: true, error: null })
  const request = (async () => {
    try {
      const saved = await documentsApi.save({
        id,
        name: draft.resume.name,
        document: draft.resume.document,
        revision: draft.resume.revision,
      })
      const current = useDocuments.getState().drafts[id]
      if (!current) return
      const changed = current.generation !== draft.generation
      setDraft(id, {
        ...current,
        resume: changed
          ? { ...current.resume, revision: saved.revision, updatedAt: saved.updatedAt }
          : saved,
        dirty: changed,
        saving: false,
        error: null,
      })
      if (useAppStore.getState().error?.startsWith('Document not saved:')) showError(null)
      const dashboard = useAppStore.getState().dashboard
      if (dashboard)
        useAppStore.setState({
          dashboard: {
            ...dashboard,
            resumes: dashboard.resumes.map((r) => (r.id === id ? { id, name: saved.name } : r)),
          },
        })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save this document.'
      const current = useDocuments.getState().drafts[id]
      if (current) setDraft(id, { ...current, saving: false, error: message })
      showError(new Error(`Document not saved: ${message}`))
      throw error
    }
  })()
  requests.set(id, request)
  try {
    await request
  } finally {
    requests.delete(id)
  }
  if (useDocuments.getState().drafts[id]?.dirty) await flushDraft(id)
}
export function hasUnsavedDocuments(): boolean {
  return Object.values(useDocuments.getState().drafts).some((d) => d.dirty || d.saving)
}
