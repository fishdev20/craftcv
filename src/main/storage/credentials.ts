import { safeStorage } from 'electron'
import { readFile, writeFile, unlink, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { ApiKeyProvider } from '../../shared/contracts'
export class Credentials {
  constructor(private directory: string) {}
  private supported() {
    return (
      safeStorage.isEncryptionAvailable() &&
      (process.platform !== 'linux' || safeStorage.getSelectedStorageBackend() !== 'basic_text')
    )
  }
  async has(provider: ApiKeyProvider): Promise<boolean> {
    try {
      return (await stat(join(this.directory, `${provider}.key`))).isFile()
    } catch {
      return false
    }
  }
  async get(provider: ApiKeyProvider): Promise<string> {
    if (!this.supported()) return ''
    try {
      return safeStorage.decryptString(await readFile(join(this.directory, `${provider}.key`)))
    } catch {
      return ''
    }
  }
  async set(provider: ApiKeyProvider, key: string) {
    const path = join(this.directory, `${provider}.key`)
    if (!key) {
      await unlink(path).catch((e: NodeJS.ErrnoException) => {
        if (e.code !== 'ENOENT') throw e
      })
      return
    }
    if (!this.supported())
      throw new Error(
        'OS-backed credential encryption is unavailable. Unlock your system keychain first.',
      )
    await writeFile(path, safeStorage.encryptString(key), { mode: 0o600 })
  }
}
