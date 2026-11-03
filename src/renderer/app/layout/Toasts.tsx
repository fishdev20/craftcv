import { Button, Toast } from '@heroui/react'
import { useEffect } from 'react'
import type { ExternalPage } from '@shared/contracts'
import { Icon } from '@/common/ui/icons'
import { openPage, showError, useAppStore } from '@/common/store/app-store'

/** What each provider page is for, as the button that opens it. */
const pageActions: Record<ExternalPage, { label: string; primary?: boolean }> = {
  'chatgpt-plans': { label: 'Upgrade plan', primary: true },
  'chatgpt-usage': { label: 'Usage & resets' },
  'openai-keys': { label: 'OpenAI API keys' },
  'anthropic-keys': { label: 'Claude Console keys' },
}

type Message = {
  title: string
  description: string | null
  variant: 'danger' | 'accent'
  pages: ExternalPage[]
}

// Keep transient feedback away from the wizard's persistent bottom actions.
const PLACEMENT = 'top'
const queue = new Toast.Queue<Message>()

/**
 * Shows `text` as a toast while the store holds it. "Title\nWhat to do" shows as a title over
 * its explanation. Closing the toast, or its timing out, clears the store; the store clearing
 * (the next action starts) closes the toast.
 */
function useStoreToast(
  text: string | null,
  variant: Message['variant'],
  pages: ExternalPage[],
  clear: () => void,
) {
  useEffect(() => {
    if (!text) return
    const [title, ...rest] = text.split('\n')
    let shown = true
    const id = queue.add(
      { title, description: rest.join(' ') || null, variant, pages },
      {
        // errors stay until dismissed or replaced; notices go on their own
        timeout: variant === 'danger' ? undefined : 6000,
        onClose: () => {
          if (shown) clear()
        },
      },
    )
    return () => {
      shown = false
      queue.close(id)
    }
  }, [text, variant, pages, clear])
}

const clearError = () => showError(null)
const clearNotice = () => useAppStore.setState({ notice: null })

/** The app-wide error and notice, as toasts. */
export default function Toasts() {
  const error = useAppStore((s) => s.error),
    errorPages = useAppStore((s) => s.errorPages),
    notice = useAppStore((s) => s.notice)
  useStoreToast(error, 'danger', errorPages, clearError)
  useStoreToast(notice, 'accent', [], clearNotice)
  return (
    <Toast.Provider queue={queue} placement={PLACEMENT}>
      {({ toast }) => {
        const { title, description, variant, pages } = toast.content
        return (
          <Toast toast={toast} variant={variant} placement={PLACEMENT} className="app-toast">
            <Toast.Indicator variant={variant} />
            <Toast.Content>
              <Toast.Title>{title}</Toast.Title>
              {description && <Toast.Description>{description}</Toast.Description>}
              {pages.length > 0 && (
                <div className="toast-actions">
                  {pages.map((page) => (
                    <Button
                      key={page}
                      size="sm"
                      variant={pageActions[page].primary ? 'primary' : 'secondary'}
                      onPress={() => void openPage(page)}
                    >
                      {pageActions[page].label}
                      <Icon icon="lucide:arrow-up-right" width={14} />
                    </Button>
                  ))}
                </div>
              )}
            </Toast.Content>
            <Toast.CloseButton
              aria-label={variant === 'danger' ? 'Dismiss error' : 'Dismiss notification'}
            />
          </Toast>
        )
      }}
    </Toast.Provider>
  )
}
