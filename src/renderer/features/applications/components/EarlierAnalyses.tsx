import { useNavigate } from 'react-router'
import { Button } from '@heroui/react'
import ConfirmRemove from '@/common/ui/ConfirmRemove'
import { useAppStore } from '@/common/store/app-store'
import { usePendingAction } from '@/common/ui/usePendingAction'
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
        <EarlierAnalysisRow key={s.id} session={s} busy={busy} onOpen={() => navigate('/')} />
      ))}
    </LibrarySection>
  )
}

function EarlierAnalysisRow({
  session,
  busy,
  onOpen,
}: {
  session: { id: string; title: string; createdAt: string }
  busy: boolean
  onOpen: () => void
}) {
  const { pending, run } = usePendingAction()
  return (
    <div className="library-row">
      <Button
        variant="ghost"
        className="session-link"
        isPending={pending === 'open'}
        isDisabled={busy}
        onClick={() =>
          void run('open', () => openSession(session.id)).then((opened) => {
            if (opened) onOpen()
          })
        }
      >
        <strong>{pending === 'open' ? 'Opening analysis…' : session.title}</strong>
        <small>{new Date(session.createdAt).toLocaleString()}</small>
      </Button>
      <ConfirmRemove
        label="Remove session"
        isDisabled={busy || pending !== null}
        onConfirm={() => deleteSession(session.id)}
      />
    </div>
  )
}
