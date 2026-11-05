import { useRef, useState } from 'react'

/** Keeps feedback on the control that started an asynchronous action. */
export function usePendingAction() {
  const [pending, setPending] = useState<string | null>(null)
  const running = useRef(false)

  const run = async <T>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
    if (running.current) return undefined
    running.current = true
    setPending(key)
    try {
      return await action()
    } finally {
      running.current = false
      setPending(null)
    }
  }

  return { pending, run }
}
