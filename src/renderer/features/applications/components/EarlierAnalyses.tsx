import { useNavigate } from 'react-router'
import { Button } from '@heroui/react'
import ConfirmRemove from '@/common/ui/ConfirmRemove'
import { useAppStore } from '@/common/store/app-store'
import { deleteSession, openSession } from '@/features/workspace/actions'
import LibrarySection from '@/features/library/components/LibrarySection'

/** Analyses saved before applications were tracked, still open for review. */
export default function EarlierAnalyses() {
  const sessions = useAppStore((s) => s.dashboard?.sessions),
    applications = useAppStore((s) => s.dashboard?.applications),
    busy = useAppStore((s) => s.busy)
  const navigate = useNavigate()
  // sessions an application already leads to are reached through its card
  const linked = new Set(applications?.map((application) => application.sessionId))
  const earlier = sessions?.filter((session) => !linked.has(session.id)) ?? []
  if (!earlier.length) return null
  return (
    <LibrarySection icon="lucide:history" title="Earlier analyses">
      {earlier.map((s) => (
        <div className="library-row" key={s.id}>
          <Button
            variant="ghost"
            className="session-link"
            isDisabled={busy}
            onClick={() =>
              void openSession(s.id).then((opened) => {
                if (opened) navigate('/')
              })
            }
          >
            <strong>{s.title}</strong>
            <small>{new Date(s.createdAt).toLocaleString()}</small>
          </Button>
          <ConfirmRemove
            label="Remove session"
            isDisabled={busy}
            onConfirm={() => deleteSession(s.id)}
          />
        </div>
      ))}
    </LibrarySection>
  )
}
