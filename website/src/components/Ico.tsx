import { Icon } from '@iconify/react'
import { iconData } from '@/lib/icons'

/** An Iconify icon, resolved on the server from the bundled collections. */
export function Ico({ name, color, label }: { name: string; color?: string; label?: string }) {
  return (
    <Icon
      icon={iconData(name)}
      color={color}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
    />
  )
}
