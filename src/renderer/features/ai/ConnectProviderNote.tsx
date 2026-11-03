import { Link, Typography } from '@heroui/react'

/** Shown under a cloud request form when the chosen provider is not connected yet. */
export default function ConnectProviderNote() {
  return (
    <Typography.Paragraph size="sm">
      Connect this provider in <Link href="/settings">Settings</Link> to continue.
    </Typography.Paragraph>
  )
}
