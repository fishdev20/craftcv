import type { ApplicationStatus } from '@shared/contracts'
import { action, notify, refreshDashboard, showError } from '@/common/store/app-store'
import { forgetApplication, setApplication, useWorkspaceStore } from '@/features/workspace/store'
import { applicationsApi } from './api'

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  preparing: 'Preparing',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer',
  closed: 'Closed',
}

/** Moves an application on the tracker, keeping an open wizard in step with it. */
export const setApplicationStatus = (id: string, status: ApplicationStatus) =>
  action(async () => {
    const updated = await applicationsApi.setStatus(id, status)
    if (useWorkspaceStore.getState().application?.id === id) setApplication(updated)
    await refreshDashboard()
    notify(`Moved to ${STATUS_LABELS[status]}.`)
  })

export const removeApplication = (id: string) =>
  action(async () => {
    await applicationsApi.remove(id)
    forgetApplication(id)
    await refreshDashboard()
  })

/** Opens the job posting in the browser; a failure shows without clearing other messages. */
export const openApplicationLink = (id: string) => applicationsApi.openLink(id).catch(showError)
