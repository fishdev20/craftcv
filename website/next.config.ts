import type { NextConfig } from 'next'
import { fileURLToPath } from 'node:url'

// served by Vercel: the pages are prerendered, and src/app/api/github handles starring the repo
const config: NextConfig = {
  images: { unoptimized: true },
  trailingSlash: true,
  // this folder is its own project inside the desktop app's repository
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  // the second landing page became the home page
  async redirects() {
    return [{ source: '/v2/', destination: '/', permanent: true }]
  },
}

export default config
