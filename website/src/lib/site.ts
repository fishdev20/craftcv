import { buttonVariants } from '@heroui/styles'

// the repository on GitHub, named once
export const OWNER = 'fishdev20'
export const NAME = 'craftcv'

export const REPO = `https://github.com/${OWNER}/${NAME}`
export const RELEASES = `${REPO}/releases`
export const REPO_API = `https://api.github.com/repos/${OWNER}/${NAME}`
export const RELEASES_API = `${REPO_API}/releases?per_page=10`
// the release page, which reads the builds from GitHub (src/app/download)
export const DOWNLOAD = '/download/'

// HeroUI's button classes on a link, plus the motion layer's hooks
export const primary = `${buttonVariants({ variant: 'primary', size: 'lg' })} btn btn--primary`
export const secondary = `${buttonVariants({ variant: 'outline', size: 'lg' })} btn btn--secondary`
