import type { BrowserWindow } from 'electron'
import type { JobAnalysisEvent, Progress } from '../../shared/contracts'
import type { ChatGPTAuth } from '../ai/chatgpt-auth'
import type { AppPaths } from '../core/paths'
import type { Operations } from '../core/operations'
import type { Credentials } from '../storage/credentials'
import type { Store } from '../storage/store'

/** What the services are built from; index.ts creates each once. */
export type ServiceDeps = {
  store: Store
  credentials: Credentials
  chatgpt: ChatGPTAuth
  paths: AppPaths
  operations: Operations
  /** Sends a progress line to the renderer. */
  progress: (progress: Progress) => void
  /** Sends a step of an AI job analysis to the renderer as it runs. */
  jobAnalysis: (event: JobAnalysisEvent) => void
  /** The window that native dialogs and printing attach to. */
  window: () => BrowserWindow
}
