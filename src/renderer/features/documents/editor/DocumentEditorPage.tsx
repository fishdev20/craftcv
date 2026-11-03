import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Alert, Link } from '@heroui/react'
import type { Resume } from '@shared/contracts'
import Loading from '@/common/ui/Loading'
import { documentsApi } from '../api'
import { openDraft, useDocuments } from '../drafts-store'
import ResumeEditor from './ResumeEditor'

/** Loads the document in the address, opens its draft, then hands it to the editor. */
export default function DocumentEditorPage() {
  const { id } = useParams(),
    [loaded, setLoaded] = useState<Resume | null>(null),
    [error, setError] = useState('')
  useEffect(() => {
    let cancelled = false
    if (!id) return
    documentsApi
      .get(id)
      .then((resume) => {
        if (cancelled) return
        openDraft(resume)
        setLoaded(useDocuments.getState().drafts[id].resume)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not open document.')
      })
    return () => {
      cancelled = true
    }
  }, [id])
  if (error)
    return (
      <main className="page">
        <Alert status="danger" role="alert">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
        <Link href="/documents">Back to documents</Link>
      </main>
    )
  if (!loaded || loaded.id !== id) return <Loading label="Opening document…" />
  return <ResumeEditor key={loaded.id} resume={loaded} />
}
