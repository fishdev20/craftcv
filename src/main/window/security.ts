import { session, type BrowserWindow, type IpcMainInvokeEvent } from 'electron'
import { pathToFileURL } from 'node:url'
import type { AppPaths } from '../core/paths'

/** Denies every permission request (camera, notifications, …): the app needs none. */
export function denyPermissions() {
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) =>
    callback(false),
  )
  session.defaultSession.setPermissionCheckHandler(() => false)
}

/** Stops the renderer opening windows, navigating away, or attaching webviews. */
export function lockNavigation(window: BrowserWindow) {
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event) => event.preventDefault())
  window.webContents.on('will-attach-webview', (event) => event.preventDefault())
}

/**
 * Throws unless an IPC call comes from the main window's top frame, showing the app's own
 * document (the dev server in development, the packaged index.html otherwise).
 */
export function assertTrustedSender(
  event: IpcMainInvokeEvent,
  window: BrowserWindow | null,
  paths: AppPaths,
) {
  if (
    !window ||
    event.sender !== window.webContents ||
    event.senderFrame !== window.webContents.mainFrame
  )
    throw new Error('Untrusted IPC sender.')
  const url = event.senderFrame.url
  const expected = process.env.ELECTRON_RENDERER_URL || pathToFileURL(paths.rendererHtml).href
  if (
    url.split('#')[0] !== expected.split('#')[0] &&
    url.split('#')[0] !== expected.replace(/\/$/, '') + '/'
  )
    throw new Error('Untrusted document.')
}
