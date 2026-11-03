import type { ExternalPage, Progress } from '@shared/contracts'
import { bridge, unwrap } from './bridge'

/** Calls that belong to the app as a whole rather than to one feature. */
export const appApi = {
  dashboard: () => unwrap(bridge().dashboard()),
  cancel: () => unwrap(bridge().cancel()),
  openPage: (page: ExternalPage) => unwrap(bridge().openPage(page)),
  onProgress: (callback: (progress: Progress) => void) => bridge().onProgress(callback),
}
