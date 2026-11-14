import 'server-only'
import type { IconifyIcon } from '@iconify/react'
import lucide from '@iconify-json/lucide/icons.json'
import logos from '@iconify-json/logos/icons.json'
import simple from '@iconify-json/simple-icons/icons.json'
import vscode from '@iconify-json/vscode-icons/icons.json'

type Collection = {
  icons: Record<string, { body: string; width?: number; height?: number }>
  aliases?: Record<string, { parent: string }>
  width?: number
  height?: number
}

const sets: Record<string, Collection> = {
  lucide,
  logos,
  'simple-icons': simple,
  'vscode-icons': vscode,
}

/**
 * Looks an icon up in the bundled Iconify collections at build time, so the page ships only the
 * icons it uses and never calls the Iconify API.
 */
export function iconData(name: string): IconifyIcon {
  const [prefix, id] = name.split(':')
  const set = sets[prefix]
  const key = set?.icons[id] ? id : set?.aliases?.[id]?.parent
  const icon = key ? set.icons[key] : undefined
  if (!set || !icon) throw new Error(`Unknown icon ${name}`)
  return { ...icon, width: icon.width ?? set.width ?? 16, height: icon.height ?? set.height ?? 16 }
}
