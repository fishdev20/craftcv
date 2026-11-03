import { hasUnsavedDocuments } from '@/features/documents/drafts-store'

/** Window-level listeners: the unsaved-changes guard, and the print document's swap-in. */
export function registerWindowEvents() {
  window.addEventListener('beforeunload', (event) => {
    if (hasUnsavedDocuments()) {
      event.preventDefault()
      event.returnValue = ''
    }
  })
  window.addEventListener('craftcv-print', (event) => {
    const el = document.getElementById('print-document')!
    el.textContent = (event as CustomEvent<string>).detail
    document.body.classList.add('printing')
  })
  window.addEventListener('craftcv-print-clear', () => {
    document.body.classList.remove('printing')
    document.getElementById('print-document')!.textContent = ''
  })
}
