import { clipboard, shell } from 'electron'
import { z } from 'zod'
import { externalPageSchema } from '../../../shared/contracts'
import { BRIDGE_VERSION } from '../../../shared/runtime'
import { externalPages } from '../../core/external-pages'
import type { Services } from '../../services'
import { none, type Handle } from '../handle'

export function appRoutes(handle: Handle, services: Services) {
  handle('getRuntimeInfo', none, () => ({ bridgeVersion: BRIDGE_VERSION }))
  handle('dashboard', none, () => services.dashboard.get())
  handle('cancel', none, () => services.operations.cancel())
  handle('copy', z.string().max(100000), (text) => clipboard.writeText(text))
  handle('openPage', externalPageSchema, (page) => shell.openExternal(externalPages[page]))
}
