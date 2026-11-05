import { Spinner } from '@heroui/react'
import { Icon } from './icons'

/** An action's existing icon becomes a small spinner while that action runs. */
export default function ActionIcon({
  pending,
  icon,
  width = 15,
}: {
  pending: boolean
  icon: string
  width?: number
}) {
  return pending ? (
    <Spinner aria-hidden="true" size="sm" color="current" />
  ) : (
    <Icon icon={icon} width={width} />
  )
}
