import { join } from 'node:path'

export type AppPaths = ReturnType<typeof appPaths>

/**
 * Every path the main process uses. `mainDir` is the built main entry's directory: lazily
 * loaded modules are bundled into chunks elsewhere, so nothing below may rely on its own
 * `__dirname` to find workers, the preload or the renderer.
 */
export function appPaths(mainDir: string, dataDir: string) {
  return {
    data: dataDir,
    database: join(dataDir, 'craftcv.sqlite'),
    cache: join(dataDir, 'cache'),
    preload: join(mainDir, '../preload/index.js'),
    rendererHtml: join(mainDir, '../renderer/index.html'),
    /**
     * The app icon in the source tree. Packaged builds get it from electron-builder; an
     * unpackaged run would otherwise show Electron's own icon.
     */
    sourceIcon: join(mainDir, '../../build/icon.png'),
    /** The built worker scripts, named by their entries in electron.vite.config.ts. */
    worker: (name: 'scanner' | 'document') => join(mainDir, `${name}.js`),
  }
}
