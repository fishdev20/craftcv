import type { ApplicationStatus, ApplicationStep } from '@shared/contracts'

/** Where a preparing application is in the new-application flow. */
export const STEP_LABELS: Record<ApplicationStep, string> = {
  job: 'Adding the job',
  analysis: 'Checking the job',
  cv: 'Choosing a CV',
  projects: 'Choosing projects',
  review: 'Reviewing suggestions',
}

export const STATUS_ICONS: Record<ApplicationStatus, string> = {
  preparing: 'lucide:pencil-line',
  applied: 'lucide:send',
  interviewing: 'lucide:users',
  offer: 'lucide:badge-check',
  closed: 'lucide:archive',
}

export const day = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/** The type a dragged application card carries, so only cards can drop on a column. */
export const DRAG_TYPE = 'application/x-craftcv-application'
