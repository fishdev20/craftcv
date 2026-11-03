import { app, dialog } from 'electron'
import { chmod, mkdir } from 'node:fs/promises'
import { ChatGPTAuth } from './ai/chatgpt-auth'
import { Operations } from './core/operations'
import { appPaths } from './core/paths'
import { registerIpc } from './ipc'
import { createServices } from './services'
import { Credentials } from './storage/credentials'
import { Store } from './storage/store'
import { MainWindow } from './window/main-window'
import { assertTrustedSender, denyPermissions } from './window/security'

const started = performance.now()
if (process.env.CRAFTCV_TEST_DATA) app.setPath('userData', process.env.CRAFTCV_TEST_DATA)
// this file is the bundle's entry, so its directory is the one the workers are built into
const paths = appPaths(__dirname, app.getPath('userData'))
const operations = new Operations()
const window = new MainWindow(paths, () => operations.cancel(), started)
let store: Store | undefined

async function start() {
  if (!app.isPackaged) app.dock?.setIcon(paths.sourceIcon)
  await mkdir(paths.data, { recursive: true, mode: 0o700 })
  await chmod(paths.data, 0o700).catch(() => {})
  store = new Store(paths.database)
  const services = createServices({
    store,
    credentials: new Credentials(paths.data),
    chatgpt: new ChatGPTAuth(paths.data),
    paths,
    operations,
    progress: (progress) => window.sendProgress(progress),
    jobAnalysis: (event) => window.sendJobAnalysis(event),
    window: () => window.require(),
  })
  denyPermissions()
  registerIpc(services, (event) => assertTrustedSender(event, window.current, paths))
  await window.open()
}

if (!app.requestSingleInstanceLock()) app.quit()
else {
  app.on('second-instance', () => window.restore())
  app
    .whenReady()
    .then(start)
    .catch((error) => {
      dialog.showErrorBox('CraftCV could not start', String(error))
      app.quit()
    })
  app.on('activate', () => {
    void window.open()
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
  app.on('before-quit', () => {
    operations.cancel()
    store?.close()
  })
}
