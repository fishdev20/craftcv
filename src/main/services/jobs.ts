import type { JobImport } from '../../shared/contracts'
import { JOB_MAX_LENGTH } from '../../shared/job'
import type { JobPosting } from '../domain/job-posting'
import type { ServiceDeps } from './deps'

/** Job descriptions read from a link the person pasted, or from the page it opens. */
export function createJobService({ operations, progress, window }: ServiceDeps) {
  // The link last tried. Opening the posting loads this one, so the renderer never names an
  // address for the main process to open.
  let lastLink: string | null = null

  const imported = async (
    posting: JobPosting,
    fromPage: boolean,
    url: string,
  ): Promise<JobImport> => {
    const { jobText } = await import('../domain/job-posting')
    return {
      text: jobText(posting).slice(0, JOB_MAX_LENGTH),
      title: posting.title,
      company: posting.company,
      location: posting.location,
      url,
      fromPage,
    }
  }

  return {
    importLink: (link: string) => {
      lastLink = link.trim()
      return operations.run(async (signal): Promise<JobImport> => {
        progress({ phase: 'Reading the job posting', files: 0, total: 0 })
        const { readJobLink } = await import('../jobs/job-link')
        const { posting, fromPage } = await readJobLink(link, signal)
        return imported(posting, fromPage, link.trim())
      })
    },

    /** Opens the last link tried in a window of its own, for sites that block CraftCV. */
    async openPage() {
      if (!lastLink) throw new Error('Paste the job posting’s link first.')
      const { openJobPage } = await import('../jobs/job-page')
      await openJobPage(lastLink, window())
    },

    /** The job from the page the person opened, which closes once it is read. */
    async usePage(): Promise<JobImport> {
      const { readJobPage } = await import('../jobs/job-page')
      const { posting, fromPage, url } = await readJobPage()
      return imported(posting, fromPage, url)
    },

    async closePage() {
      const { close } = await import('../jobs/job-page')
      close()
    },
  }
}
