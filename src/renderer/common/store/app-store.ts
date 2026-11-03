import { create } from 'zustand'
import type { Dashboard, ExternalPage, Progress } from '@shared/contracts'
import { appApi } from '../api/app-api'
import { BridgeError } from '../api/bridge'

interface AppState {
  /** Everything the local database holds, as the main process last reported it. */
  dashboard: Dashboard | null
  /** A long operation is running; most actions are disabled meanwhile. */
  busy: boolean
  progress: Progress | null
  error: string | null
  /** Provider pages the error toast links to, for the current error. */
  errorPages: ExternalPage[]
  notice: string | null
  refresh: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  dashboard: null,
  busy: false,
  progress: null,
  error: null,
  errorPages: [],
  notice: null,
  refresh: async () => {
    try {
      set({ dashboard: await appApi.dashboard() })
    } catch (error) {
      showError(error, 'Could not load local data.')
    }
  },
}))

/** Shows an error as a toast, with the pages that can fix it; null clears it. */
export function showError(error: unknown, fallback = 'Something went wrong.') {
  useAppStore.setState(
    error === null
      ? { error: null, errorPages: [] }
      : {
          error: error instanceof Error ? error.message : fallback,
          errorPages: error instanceof BridgeError ? error.pages : [],
        },
  )
}

export const refreshDashboard = () => useAppStore.getState().refresh()
export const notify = (notice: string) => useAppStore.setState({ notice })
export const setProgress = (progress: Progress | null) => useAppStore.setState({ progress })

/** Runs a user action: clears the toasts, and shows its error instead of throwing it. */
export async function action<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    useAppStore.setState({ error: null, errorPages: [], notice: null })
    return await fn()
  } catch (error) {
    showError(error)
    return undefined
  }
}

/** Opens one of a provider's own pages in the browser, keeping the toast that offered it. */
export const openPage = (page: ExternalPage) => appApi.openPage(page).catch(showError)

/** Like `action`, while marking the app busy, optionally with an opening progress line. */
export async function busyAction<T>(
  fn: () => Promise<T>,
  progress: Progress | null = null,
): Promise<T | undefined> {
  useAppStore.setState({ busy: true, progress })
  try {
    return await action(fn)
  } finally {
    useAppStore.setState({ busy: false, progress: null })
  }
}
