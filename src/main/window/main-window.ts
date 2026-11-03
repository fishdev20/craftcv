import { app, BrowserWindow, dialog } from 'electron'
import type { JobAnalysisEvent, Progress } from '../../shared/contracts'
import type { AppPaths } from '../core/paths'
import { lockNavigation } from './security'

/** The single app window: sandboxed, isolated, and unable to navigate away. */
export class MainWindow {
  private window: BrowserWindow | null = null

  constructor(
    private paths: AppPaths,
    private onClosed: () => void,
    private startedAt: number,
  ) {}

  get current() {
    return this.window
  }

  /** The window, for dialogs and printing; only called while handling its own IPC. */
  require(): BrowserWindow {
    if (!this.window) throw new Error('The CraftCV window is not open.')
    return this.window
  }

  sendProgress(progress: Progress) {
    if (this.window && !this.window.isDestroyed())
      this.window.webContents.send('craftcv:progress', progress)
  }

  sendJobAnalysis(event: JobAnalysisEvent) {
    if (this.window && !this.window.isDestroyed())
      this.window.webContents.send('craftcv:jobAnalysis', event)
  }

  restore() {
    if (this.window?.isMinimized()) this.window.restore()
    this.window?.focus()
  }

  async open() {
    if (this.window) {
      this.window.focus()
      return
    }
    const window = new BrowserWindow({
      width: 1260,
      height: 860,
      minWidth: 860,
      minHeight: 640,
      title: 'CraftCV',
      // Windows and Linux take the window's icon; macOS uses the Dock icon set at startup
      ...(!app.isPackaged && { icon: this.paths.sourceIcon }),
      backgroundColor: '#ffffff',
      show: false,
      webPreferences: {
        preload: this.paths.preload,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
      },
    })
    this.window = window
    window.webContents.on('will-prevent-unload', () => {
      void dialog.showMessageBox(window, {
        type: 'warning',
        message: 'Your document has unsaved changes.',
        detail:
          'Wait for autosave or use Retry save in the document editor before closing CraftCV.',
        buttons: ['Keep editing'],
      })
    })
    lockNavigation(window)
    window.on('closed', () => {
      this.onClosed()
      this.window = null
    })
    window.once('ready-to-show', () => {
      window.show()
      console.info(`CraftCV window ready: ${Math.round(performance.now() - this.startedAt)} ms`)
    })
    if (process.env.ELECTRON_RENDERER_URL) await window.loadURL(process.env.ELECTRON_RENDERER_URL)
    else await window.loadFile(this.paths.rendererHtml)
  }
}
