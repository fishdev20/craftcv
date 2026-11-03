import { useEffect, useState, type ReactNode } from 'react'
import { Alert } from '@heroui/react'
import Loading from '@/common/ui/Loading'
import { hasCurrentBridge, RESTART_MESSAGE, verifyRuntime } from '@shared/runtime'
export default function RuntimeGate({ children }: { children: ReactNode }) {
  const available = hasCurrentBridge(window.craftcv)
  const [status, setStatus] = useState<'checking' | 'ready' | 'outdated'>('checking')
  useEffect(() => {
    if (!available) return
    let cancelled = false
    void verifyRuntime(window.craftcv).then((ready) => {
      if (!cancelled) setStatus(ready ? 'ready' : 'outdated')
    })
    return () => {
      cancelled = true
    }
  }, [available])
  if (!available || status === 'outdated')
    return (
      <main className="page">
        <Alert status="warning" role="alert">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Restart CraftCV to finish updating.</Alert.Title>
            <Alert.Description>{RESTART_MESSAGE}</Alert.Description>
          </Alert.Content>
        </Alert>
      </main>
    )
  if (status === 'checking') return <Loading label="Connecting to CraftCV…" />
  return children
}
